# Phase 4: Advanced Features

**Duration**: 4-6 weeks  
**Status**: ⏳ Pending Phase 3

## Overview

Enhance the TypeScript library with advanced features that improve usability, performance, and functionality beyond the Python version.

## Deliverables

### 4.1 Plugin System

#### Plugin Architecture

```typescript
interface ScraperPlugin {
  name: string;
  version: string;
  description: string;
  shouldRun(host: string, method: string): boolean;
  run<T>(originalMethod: () => T, context: PluginContext): T;
}

interface PluginContext {
  scraper: AbstractScraper;
  host: string;
  method: string;
  html: string;
  url: string;
}

class PluginManager {
  private plugins: ScraperPlugin[] = [];
  
  register(plugin: ScraperPlugin): void {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  applyPlugins<T>(
    method: () => T, 
    context: PluginContext
  ): T {
    let result = method;
    
    for (const plugin of this.plugins) {
      if (plugin.shouldRun(context.host, context.method)) {
        const originalResult = result;
        result = () => plugin.run(originalResult, context);
      }
    }
    
    return result();
  }
}
```

#### Built-in Plugins

```typescript
// HTML Tag Stripper Plugin
class HtmlTagStripperPlugin implements ScraperPlugin {
  name = 'html-tag-stripper';
  version = '1.0.0';
  description = 'Removes HTML tags from text content';
  
  shouldRun(host: string, method: string): boolean {
    return ['title', 'instructions', 'ingredients'].includes(method);
  }
  
  run<T>(originalMethod: () => T, context: PluginContext): T {
    const result = originalMethod();
    
    if (typeof result === 'string') {
      return this.stripHtmlTags(result) as T;
    }
    
    if (Array.isArray(result)) {
      return result.map(item => 
        typeof item === 'string' ? this.stripHtmlTags(item) : item
      ) as T;
    }
    
    return result;
  }
  
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

// Text Normalization Plugin
class TextNormalizationPlugin implements ScraperPlugin {
  name = 'text-normalization';
  version = '1.0.0';
  description = 'Normalizes whitespace and special characters';
  
  shouldRun(host: string, method: string): boolean {
    return true; // Apply to all text methods
  }
  
  run<T>(originalMethod: () => T, context: PluginContext): T {
    const result = originalMethod();
    
    if (typeof result === 'string') {
      return this.normalizeText(result) as T;
    }
    
    if (Array.isArray(result)) {
      return result.map(item => 
        typeof item === 'string' ? this.normalizeText(item) : item
      ) as T;
    }
    
    return result;
  }
  
  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim();
  }
}

// Ingredient Parsing Plugin
class IngredientParsingPlugin implements ScraperPlugin {
  name = 'ingredient-parsing';
  version = '1.0.0';
  description = 'Parses ingredients into structured data';
  
  shouldRun(host: string, method: string): boolean {
    return method === 'ingredients';
  }
  
  run<T>(originalMethod: () => T, context: PluginContext): T {
    const ingredients = originalMethod() as string[];
    
    return ingredients.map(ingredient => {
      const parsed = this.parseIngredient(ingredient);
      return parsed.original; // Return original for compatibility
    }) as T;
  }
  
  private parseIngredient(ingredient: string): ParsedIngredient {
    // Complex ingredient parsing logic
    const quantityMatch = ingredient.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(\w+)?\s+(.*)/);
    
    if (quantityMatch) {
      const [, quantity, unit, name] = quantityMatch;
      return {
        original: ingredient,
        quantity: parseFloat(quantity),
        unit: unit || '',
        name: name.trim(),
        notes: this.extractNotes(name)
      };
    }
    
    return {
      original: ingredient,
      quantity: null,
      unit: '',
      name: ingredient,
      notes: []
    };
  }
}
```

### 4.2 Enhanced Data Structures

#### Structured Recipe Data

```typescript
interface StructuredRecipe {
  // Basic information
  title: string;
  description?: string;
  author?: Author;
  datePublished?: Date;
  dateModified?: Date;
  
  // Recipe details
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  nutrition?: NutritionData;
  
  // Timing and servings
  prepTime?: Duration;
  cookTime?: Duration;
  totalTime?: Duration;
  yields?: Yield;
  
  // Media and metadata
  images: ImageData[];
  videos?: VideoData[];
  categories: string[];
  cuisines: string[];
  tags: string[];
  
  // Ratings and reviews
  aggregateRating?: AggregateRating;
  reviews?: Review[];
  
  // Technical metadata
  canonicalUrl: string;
  siteName?: string;
  language?: string;
  schema?: any; // Raw schema.org data
}

interface IngredientGroup {
  name?: string; // e.g., "For the sauce"
  ingredients: ParsedIngredient[];
}

interface ParsedIngredient {
  original: string;
  quantity?: number;
  unit?: string;
  name: string;
  notes?: string[];
  optional?: boolean;
  substitutions?: string[];
}

interface InstructionStep {
  text: string;
  order: number;
  image?: string;
  time?: Duration;
  temperature?: Temperature;
  equipment?: string[];
}

interface Duration {
  minutes: number;
  iso8601?: string; // PT30M
  display?: string; // "30 minutes"
}

interface Yield {
  amount?: number;
  unit?: string; // "servings", "pieces", etc.
  description?: string; // "4-6 servings"
}
```

#### Enhanced Parser Methods

```typescript
abstract class EnhancedAbstractScraper extends AbstractScraper {
  // Enhanced methods returning structured data
  getStructuredRecipe(): StructuredRecipe {
    return {
      title: this.title(),
      description: this.description(),
      author: this.getAuthor(),
      ingredients: this.getIngredientGroups(),
      instructions: this.getInstructionSteps(),
      nutrition: this.getNutrition(),
      prepTime: this.getPrepTime(),
      cookTime: this.getCookTime(),
      totalTime: this.getTotalTime(),
      yields: this.getYield(),
      images: this.getImages(),
      categories: this.getCategories(),
      cuisines: this.getCuisines(),
      tags: this.getTags(),
      aggregateRating: this.getAggregateRating(),
      canonicalUrl: this.canonicalUrl(),
      siteName: this.siteName(),
      language: this.getLanguage(),
      schema: this.getSchemaData()
    };
  }
  
  protected getIngredientGroups(): IngredientGroup[] {
    const ingredients = this.ingredients();
    
    // Try to detect ingredient groups
    const groups = this.detectIngredientGroups(ingredients);
    
    if (groups.length > 1) {
      return groups;
    }
    
    // Single group with all ingredients
    return [{
      ingredients: ingredients.map(ing => this.parseIngredient(ing))
    }];
  }
  
  protected getInstructionSteps(): InstructionStep[] {
    const instructions = this.instructions();
    
    return instructions.map((instruction, index) => ({
      text: instruction,
      order: index + 1,
      time: this.extractTimeFromInstruction(instruction),
      temperature: this.extractTemperatureFromInstruction(instruction),
      equipment: this.extractEquipmentFromInstruction(instruction)
    }));
  }
  
  protected getNutrition(): NutritionData | undefined {
    try {
      return this.schemaOrg.nutrition() || this.nutritionFromSelectors();
    } catch {
      return undefined;
    }
  }
  
  protected getAggregateRating(): AggregateRating | undefined {
    try {
      const rating = this.schemaOrg.aggregateRating();
      if (rating) {
        return {
          ratingValue: rating.ratingValue,
          ratingCount: rating.ratingCount,
          reviewCount: rating.reviewCount,
          bestRating: rating.bestRating || 5,
          worstRating: rating.worstRating || 1
        };
      }
    } catch {
      return undefined;
    }
  }
}
```

### 4.3 Performance Optimizations

#### Lazy Loading and Caching

```typescript
class OptimizedScraper extends EnhancedAbstractScraper {
  private cache = new Map<string, any>();
  private loadedParsers = new Set<string>();
  
  protected memoize<T>(key: string, fn: () => T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = fn();
    this.cache.set(key, result);
    return result;
  }
  
  title(): string {
    return this.memoize('title', () => super.title());
  }
  
  ingredients(): string[] {
    return this.memoize('ingredients', () => super.ingredients());
  }
  
  // Lazy load heavy parsers
  private ensureSchemaOrgLoaded(): void {
    if (!this.loadedParsers.has('schema')) {
      this.schemaOrg = new SchemaOrgParser(this.html);
      this.loadedParsers.add('schema');
    }
  }
  
  // Selective parsing based on what's requested
  getMinimalRecipe(): MinimalRecipe {
    return {
      title: this.title(),
      ingredients: this.ingredients(),
      instructions: this.instructions()
    };
  }
  
  getFullRecipe(): StructuredRecipe {
    this.ensureSchemaOrgLoaded();
    return this.getStructuredRecipe();
  }
}
```

#### Parallel Processing

```typescript
class ParallelScraper {
  async scrapeMultiple(urls: string[]): Promise<StructuredRecipe[]> {
    const chunks = this.chunkArray(urls, 10); // Process 10 at a time
    const results: StructuredRecipe[] = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(url => this.scrapeSingle(url))
      );
      results.push(...chunkResults.filter(Boolean));
    }
    
    return results;
  }
  
  private async scrapeSingle(url: string): Promise<StructuredRecipe | null> {
    try {
      const html = await this.fetchHtml(url);
      const scraper = createScraper(html, url);
      return scraper.getStructuredRecipe();
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return null;
    }
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### 4.4 Browser Compatibility

#### Universal Bundle

```typescript
// Browser-compatible version
class BrowserScraper {
  static async scrapeFromUrl(url: string): Promise<StructuredRecipe> {
    // Use CORS proxy or browser extension
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();
    
    return this.scrapeFromHtml(html, url);
  }
  
  static scrapeFromHtml(html: string, url: string): StructuredRecipe {
    const scraper = createScraper(html, url);
    return scraper.getStructuredRecipe();
  }
  
  // DOM-based scraping for browser environment
  static scrapeFromDOM(url: string = window.location.href): StructuredRecipe {
    const html = document.documentElement.outerHTML;
    return this.scrapeFromHtml(html, url);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrowserScraper, createScraper };
}

if (typeof window !== 'undefined') {
  (window as any).RecipeScrapers = { BrowserScraper, createScraper };
}
```

### 4.5 Developer Experience

#### TypeScript Definitions

```typescript
// Complete type definitions
export interface RecipeScrapersAPI {
  scrapeMe(url: string): Promise<StructuredRecipe>;
  scrapeHtml(html: string, url: string): StructuredRecipe;
  getSupportedUrls(): string[];
  scraperExistsFor(url: string): boolean;
  createScraper(html: string, url: string): AbstractScraper;
}

// Plugin development types
export interface PluginDevelopmentKit {
  AbstractScraper: typeof AbstractScraper;
  PluginManager: typeof PluginManager;
  createPlugin(definition: PluginDefinition): ScraperPlugin;
  testPlugin(plugin: ScraperPlugin, testCases: TestCase[]): TestResult[];
}
```

## Tasks

### Week 1-2: Plugin System
- [ ] Implement plugin architecture
- [ ] Create built-in plugins
- [ ] Plugin testing framework
- [ ] Documentation and examples

### Week 3-4: Enhanced Data Structures
- [ ] Implement structured recipe format
- [ ] Enhanced parsing methods
- [ ] Ingredient and instruction parsing
- [ ] Nutrition data extraction

### Week 5-6: Performance & Browser Support
- [ ] Performance optimizations
- [ ] Lazy loading implementation
- [ ] Browser compatibility layer
- [ ] Universal bundle creation

## Success Criteria

- ✅ Plugin system functional with built-in plugins
- ✅ Enhanced data structures implemented
- ✅ Performance improvements >20% over baseline
- ✅ Browser compatibility working
- ✅ Complete TypeScript definitions
- ✅ Developer documentation complete

## Next Phase

Once Phase 4 is complete, proceed to [Phase 5: Infrastructure](./phase5-infrastructure.md).
