# Architecture Overview

## System Architecture

The TypeScript recipe scrapers library follows a modular, extensible architecture that maintains compatibility with the Python version while leveraging TypeScript's type system and modern JavaScript features.

```mermaid
graph TB`
    subgraph "Public API"
        A[scrapeMe] --> B[scrapeHtml]
        B --> C[createScraper]
    end

    subgraph "Core Layer"
        C --> D[AbstractScraper]
        D --> E[SchemaOrgParser]
        D --> F[OpenGraphParser]
        D --> G[UtilsParser]
    end

    subgraph "Scraper Implementations"
        D --> H[AllRecipes]
        D --> I[FoodNetwork]
        D --> J[BBCGoodFood]
        D --> K[... 500+ Scrapers]
    end

    subgraph "Plugin System"
        D --> L[PluginManager]
        L --> M[HtmlTagStripper]
        L --> N[TextNormalizer]
        L --> O[IngredientParser]
    end

    subgraph "Data Layer"
        E --> P[StructuredRecipe]
        F --> P
        G --> P
        P --> Q[RecipeData]
        P --> R[NutritionData]
        P --> S[RatingData]
    end

    subgraph "Infrastructure"
        T[Error Handling] --> D
        U[Type Validation] --> P
        V[Performance Monitoring] --> D
        W[Caching] --> D
    end
```

## Core Components

### 1. Abstract Base Layer

#### AbstractScraper Class

The foundation class that all scrapers inherit from, providing:

-  Common parsing utilities
-  Error handling
-  Plugin integration
-  Type safety

```typescript
abstract class AbstractScraper {
   protected html: string;
   protected url: string;
   protected $: CheerioStatic;
   protected schemaOrg: SchemaOrgParser;
   protected openGraph: OpenGraphParser;
   protected pluginManager: PluginManager;

   constructor(html: string, url: string) {
      this.html = html;
      this.url = url;
      this.$ = cheerio.load(html);
      this.schemaOrg = new SchemaOrgParser(html);
      this.openGraph = new OpenGraphParser(this.$);
      this.pluginManager = PluginManager.getInstance();
   }

   // Abstract methods - must be implemented
   abstract host(): string;

   // Default implementations with fallbacks
   title(): string {
      return this.pluginManager.apply(
         "title",
         () => {
            return (
               this.schemaOrg.title() ||
               this.openGraph.title() ||
               this.titleFromSelector()
            );
         },
         this
      );
   }

   // Template methods for custom implementation
   protected abstract titleFromSelector(): string;
   protected abstract ingredientsFromSelector(): string[];
   protected abstract instructionsFromSelector(): string[];
}
```

### 2. Parser Utilities

#### SchemaOrgParser

Extracts structured data from JSON-LD, microdata, and RDFa formats:

```typescript
class SchemaOrgParser {
   private jsonLdData: any[];
   private microdataData: any;

   constructor(html: string) {
      this.jsonLdData = this.extractJsonLd(html);
      this.microdataData = this.extractMicrodata(html);
   }

   title(): string | null {
      return this.getRecipeProperty("name");
   }

   ingredients(): string[] | null {
      return this.getRecipeProperty("recipeIngredient");
   }

   private getRecipeProperty(property: string): any {
      // Search through JSON-LD first
      for (const data of this.jsonLdData) {
         if (this.isRecipeType(data) && data[property]) {
            return data[property];
         }
      }

      // Fallback to microdata
      return this.microdataData?.[property];
   }
}
```

#### OpenGraphParser

Extracts metadata from OpenGraph tags:

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
      const selector = `meta[property="${property}"], meta[name="${property}"]`;
      return this.$(selector).attr("content") || null;
   }
}
```

### 3. Plugin System Architecture

#### Plugin Interface

```typescript
interface ScraperPlugin {
   name: string;
   version: string;
   priority: number;
   shouldRun(host: string, method: string): boolean;
   run<T>(originalMethod: () => T, context: PluginContext): T;
}

interface PluginContext {
   scraper: AbstractScraper;
   host: string;
   method: string;
   html: string;
   url: string;
   $: CheerioStatic;
}
```

#### Plugin Manager

```typescript
class PluginManager {
   private static instance: PluginManager;
   private plugins: ScraperPlugin[] = [];

   register(plugin: ScraperPlugin): void {
      this.plugins.push(plugin);
      this.plugins.sort((a, b) => b.priority - a.priority);
   }

   apply<T>(method: string, originalFn: () => T, scraper: AbstractScraper): T {
      let result = originalFn;

      for (const plugin of this.plugins) {
         if (plugin.shouldRun(scraper.host(), method)) {
            const context = this.createContext(scraper, method);
            const previousResult = result;
            result = () => plugin.run(previousResult, context);
         }
      }

      return result();
   }
}
```

### 4. Type System

#### Core Data Types

```typescript
interface StructuredRecipe {
   // Basic Information
   title: string;
   description?: string;
   author?: Author;
   datePublished?: Date;
   dateModified?: Date;

   // Recipe Content
   ingredients: IngredientGroup[];
   instructions: InstructionStep[];

   // Metadata
   prepTime?: Duration;
   cookTime?: Duration;
   totalTime?: Duration;
   yields?: Yield;
   servings?: number;

   // Rich Media
   images: ImageData[];
   videos?: VideoData[];

   // Classification
   categories: string[];
   cuisines: string[];
   tags: string[];

   // Social Data
   aggregateRating?: AggregateRating;
   nutrition?: NutritionData;

   // Technical
   canonicalUrl: string;
   siteName?: string;
   language?: string;
}

interface IngredientGroup {
   name?: string;
   ingredients: ParsedIngredient[];
}

interface ParsedIngredient {
   original: string;
   quantity?: number;
   unit?: string;
   name: string;
   notes?: string[];
   optional?: boolean;
}

interface InstructionStep {
   text: string;
   order: number;
   image?: string;
   time?: Duration;
   temperature?: Temperature;
}
```

#### Type Guards and Validation

```typescript
function isValidRecipe(obj: any): obj is StructuredRecipe {
   return (
      typeof obj === "object" &&
      typeof obj.title === "string" &&
      Array.isArray(obj.ingredients) &&
      Array.isArray(obj.instructions) &&
      obj.ingredients.every(isValidIngredientGroup) &&
      obj.instructions.every(isValidInstructionStep)
   );
}

function isValidIngredientGroup(obj: any): obj is IngredientGroup {
   return (
      typeof obj === "object" &&
      Array.isArray(obj.ingredients) &&
      obj.ingredients.every(isValidIngredient)
   );
}
```

## Factory Pattern

### Scraper Factory

```typescript
interface ScraperConstructor {
   new (html: string, url: string): AbstractScraper;
   host(): string;
}

class ScraperFactory {
   private static scrapers = new Map<string, ScraperConstructor>();

   static register(scraper: ScraperConstructor): void {
      this.scrapers.set(scraper.host(), scraper);
   }

   static create(html: string, url: string): AbstractScraper {
      const hostname = new URL(url).hostname.replace("www.", "");
      const ScraperClass = this.scrapers.get(hostname);

      if (!ScraperClass) {
         throw new WebsiteNotImplementedError(hostname);
      }

      return new ScraperClass(html, url);
   }

   static getSupportedHosts(): string[] {
      return Array.from(this.scrapers.keys());
   }

   static exists(url: string): boolean {
      const hostname = new URL(url).hostname.replace("www.", "");
      return this.scrapers.has(hostname);
   }
}

// Auto-register scrapers
ScraperFactory.register(AllRecipes);
ScraperFactory.register(FoodNetwork);
// ... 500+ scrapers
```

## Error Handling Architecture

### Error Hierarchy

```typescript
abstract class ScrapingError extends Error {
   abstract readonly code: string;
   abstract readonly recoverable: boolean;
   readonly timestamp: Date;

   constructor(message: string, public readonly context?: any) {
      super(message);
      this.timestamp = new Date();
      this.name = this.constructor.name;
   }
}

class ElementNotFoundError extends ScrapingError {
   readonly code = "ELEMENT_NOT_FOUND";
   readonly recoverable = true;
}

class SchemaValidationError extends ScrapingError {
   readonly code = "SCHEMA_VALIDATION_FAILED";
   readonly recoverable = false;
}

class WebsiteNotImplementedError extends ScrapingError {
   readonly code = "WEBSITE_NOT_IMPLEMENTED";
   readonly recoverable = false;
}
```

### Error Handling Strategy

```typescript
class ErrorHandler {
   static handle<T>(
      operation: () => T,
      fallbacks: (() => T)[],
      context: string
   ): T {
      try {
         return operation();
      } catch (error) {
         if (error instanceof ScrapingError && error.recoverable) {
            for (const fallback of fallbacks) {
               try {
                  return fallback();
               } catch (fallbackError) {
                  console.warn(`Fallback failed in ${context}:`, fallbackError);
               }
            }
         }

         throw new Error(
            `All operations failed in ${context}: ${error.message}`
         );
      }
   }
}
```

## Performance Architecture

### Caching Strategy

```typescript
interface CacheConfig {
   ttl: number; // Time to live in ms
   maxSize: number; // Maximum cache entries
   strategy: "LRU" | "FIFO" | "LFU";
}

class PerformanceCache {
   private cache = new Map<string, CacheEntry>();

   constructor(private config: CacheConfig) {}

   get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      if (!entry || this.isExpired(entry)) {
         this.cache.delete(key);
         return null;
      }
      entry.lastAccessed = Date.now();
      return entry.value;
   }

   set<T>(key: string, value: T): void {
      if (this.cache.size >= this.config.maxSize) {
         this.evictOldest();
      }

      this.cache.set(key, {
         value,
         created: Date.now(),
         lastAccessed: Date.now(),
      });
   }
}
```

### Lazy Loading

```typescript
class LazyLoader {
   private loaded = new Set<string>();

   async loadParser(name: string, loader: () => Promise<any>): Promise<any> {
      if (this.loaded.has(name)) {
         return;
      }

      const parser = await loader();
      this.loaded.add(name);
      return parser;
   }
}
```

## Browser Compatibility Layer

### Environment Detection

```typescript
class EnvironmentDetector {
   static isNode(): boolean {
      return (
         typeof process !== "undefined" &&
         process.versions &&
         process.versions.node
      );
   }

   static isBrowser(): boolean {
      return typeof window !== "undefined" && typeof document !== "undefined";
   }

   static isWebWorker(): boolean {
      return (
         typeof importScripts === "function" &&
         typeof WorkerGlobalScope !== "undefined"
      );
   }
}
```

### Universal Exports

```typescript
// Universal module definition
(function (root, factory) {
   if (typeof exports === "object") {
      // Node.js
      module.exports = factory();
   } else if (typeof define === "function" && define.amd) {
      // AMD
      define([], factory);
   } else {
      // Browser globals
      root.RecipeScrapers = factory();
   }
})(typeof self !== "undefined" ? self : this, function () {
   return {
      scrapeMe,
      scrapeHtml,
      createScraper,
      ScraperFactory,
      AbstractScraper,
   };
});
```

This architecture provides a solid foundation for the TypeScript migration while maintaining flexibility for future enhancements and ensuring compatibility across different environments.
