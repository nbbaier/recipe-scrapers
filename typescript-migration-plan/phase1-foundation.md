# Phase 1: Foundation & Architecture

**Duration**: 4-6 weeks
**Status**: 🔄 Planned

## Overview

Establish the core TypeScript architecture, select technology stack, and create foundational classes that will support all future scrapers.

## Deliverables

### 1.1 Technology Stack Selection

**HTML Parsing**: Cheerio

-  jQuery-like server-side DOM manipulation
-  Familiar API for developers
-  Better performance than JSDOM for parsing-only tasks

**JSON-LD/Schema.org**: Custom parser + json-ld library

-  Extract structured data from HTML
-  Support JSON-LD, microdata, and RDFa formats
-  Parse schema.org recipe data

**Date/Time**: day.js with custom ISO 8601 duration parser

-  Lightweight alternative to moment.js
-  Custom parser for ISO 8601 durations (PT30M format)
-  Immutable date objects

**HTTP Client**: fetch API with node-fetch polyfill

-  Native browser support
-  Node.js compatibility
-  Modern async/await patterns

**Testing**: Jest + TypeScript

-  Comprehensive test runner
-  TypeScript support
-  Snapshot testing for HTML parsing

**Build System**: Vite with TypeScript

-  Fast HMR for development
-  ESM and CommonJS dual package
-  TypeScript compilation

### 1.2 Core Architecture

#### Base Types and Interfaces

```typescript
// Core recipe data structure
interface RecipeData {
   title: string;
   ingredients: string[];
   instructions: string[];
   totalTime?: number;
   cookTime?: number;
   prepTime?: number;
   yields?: string;
   servings?: number;
   image?: string;
   author?: string;
   description?: string;
   category?: string;
   cuisine?: string;
   tags?: string[];
   rating?: number;
   reviewCount?: number;
   nutrition?: NutritionData;
   canonicalUrl?: string;
   siteName?: string;
   datePublished?: string;
   dateModified?: string;
}

// Nutrition information
interface NutritionData {
   calories?: number;
   protein?: string;
   carbohydrates?: string;
   fat?: string;
   fiber?: string;
   sodium?: string;
   // ... other nutrition fields
}
```

#### Abstract Base Class

```typescript
abstract class AbstractScraper {
   protected html: string;
   protected url: string;
   protected $: CheerioStatic;
   protected schemaOrg: SchemaOrgParser;
   protected openGraph: OpenGraphParser;

   constructor(html: string, url: string) {
      this.html = html;
      this.url = url;
      this.$ = cheerio.load(html);
      this.schemaOrg = new SchemaOrgParser(html);
      this.openGraph = new OpenGraphParser(this.$);
   }

   // Abstract methods that must be implemented
   abstract host(): string;

   // Methods with default implementations
   title(): string {
      return (
         this.schemaOrg.title() ||
         this.openGraph.title() ||
         this.titleFromSelector()
      );
   }

   ingredients(): string[] {
      return this.schemaOrg.ingredients() || this.ingredientsFromSelector();
   }

   instructions(): string[] {
      return this.schemaOrg.instructions() || this.instructionsFromSelector();
   }

   // Abstract methods for custom parsing
   protected abstract titleFromSelector(): string;
   protected abstract ingredientsFromSelector(): string[];
   protected abstract instructionsFromSelector(): string[];

   // Utility methods
   protected normalize(text: string): string {
      return text.trim().replace(/\s+/g, " ");
   }

   protected getMinutes(timeStr: string): number {
      return parseISO8601Duration(timeStr) || parseTimeText(timeStr);
   }

   // Convert to JSON
   toJSON(): RecipeData {
      return {
         title: this.title(),
         ingredients: this.ingredients(),
         instructions: this.instructions(),
         totalTime: this.totalTime(),
         yields: this.yields(),
         image: this.image(),
         author: this.author(),
         // ... other fields
      };
   }
}
```

### 1.3 Parser Utilities

#### Schema.org Parser

```typescript
class SchemaOrgParser {
   private jsonLdData: any[];
   private microdataData: any[];

   constructor(html: string) {
      this.jsonLdData = this.extractJsonLd(html);
      this.microdataData = this.extractMicrodata(html);
   }

   private extractJsonLd(html: string): any[] {
      const $ = cheerio.load(html);
      const scripts = $('script[type="application/ld+json"]');
      return scripts
         .map((_, el) => {
            try {
               return JSON.parse($(el).html() || "");
            } catch {
               return null;
            }
         })
         .get()
         .filter(Boolean);
   }

   title(): string | null {
      return this.getRecipeProperty("name");
   }

   ingredients(): string[] | null {
      return this.getRecipeProperty("recipeIngredient");
   }

   instructions(): string[] | null {
      const instructions = this.getRecipeProperty("recipeInstructions");
      return instructions?.map((inst) =>
         typeof inst === "string" ? inst : inst.text
      );
   }

   private getRecipeProperty(property: string): any {
      for (const data of this.jsonLdData) {
         if (this.isRecipeType(data)) {
            return data[property];
         }
      }
      return null;
   }

   private isRecipeType(data: any): boolean {
      const type = data["@type"];
      return (
         type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))
      );
   }
}
```

#### OpenGraph Parser

```typescript
class OpenGraphParser {
   constructor(private $: CheerioStatic) {}

   title(): string | null {
      return this.getMetaContent("og:title");
   }

   image(): string | null {
      return this.getMetaContent("og:image");
   }

   siteName(): string | null {
      return this.getMetaContent("og:site_name");
   }

   private getMetaContent(property: string): string | null {
      const meta = this.$(`meta[property="${property}"]`).first();
      return meta.attr("content") || null;
   }
}
```

### 1.4 Utility Functions

#### Time Parsing

```typescript
function parseISO8601Duration(duration: string): number | null {
   if (!duration) return null;

   // Parse ISO 8601 duration format (PT30M, PT1H30M, etc.)
   const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
   if (!match) return null;

   const [, hours, minutes, seconds] = match;
   return (
      (hours ? parseInt(hours) * 60 : 0) +
      (minutes ? parseInt(minutes) : 0) +
      (seconds ? parseInt(seconds) / 60 : 0)
   );
}

function parseTimeText(text: string): number | null {
   if (!text) return null;

   // Handle various time formats
   const timeRegex =
      /(?:(\d+)\s*(?:hours?|hrs?|h))?(?:(\d+)\s*(?:minutes?|mins?|m))?/i;
   const match = text.match(timeRegex);

   if (!match) return null;

   const [, hours, minutes] = match;
   return (
      (hours ? parseInt(hours) * 60 : 0) + (minutes ? parseInt(minutes) : 0)
   );
}
```

### 1.5 Error Handling

```typescript
class ElementNotFoundError extends Error {
   constructor(selector: string) {
      super(`Element not found: ${selector}`);
      this.name = "ElementNotFoundError";
   }
}

class SchemaOrgException extends Error {
   constructor(message: string) {
      super(message);
      this.name = "SchemaOrgException";
   }
}

class OpenGraphException extends Error {
   constructor(message: string) {
      super(message);
      this.name = "OpenGraphException";
   }
}
```

## Tasks

-  [ ] Set up TypeScript project with Vite
-  [ ] Install and configure dependencies
-  [ ] Implement AbstractScraper base class
-  [ ] Create SchemaOrgParser utility
-  [ ] Create OpenGraphParser utility
-  [ ] Implement utility functions
-  [ ] Set up Jest testing framework
-  [ ] Create example scraper implementation
-  [ ] Write comprehensive tests
-  [ ] Document APIs and architecture

## Success Criteria

-  ✅ Complete TypeScript project setup
-  ✅ All base classes and utilities implemented
-  ✅ Test suite with >90% coverage
-  ✅ Example scraper working end-to-end
-  ✅ Performance baseline established
-  ✅ Documentation complete

## Next Phase

Once Phase 1 is complete, proceed to [Phase 2: Core Implementation](./phase2-core-implementation.md).
