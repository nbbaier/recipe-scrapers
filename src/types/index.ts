/**
 * Core TypeScript types for the recipe-scrapers library
 * Port of Python recipe_scrapers types with enhancements
 */

export interface NutritionData {
  /** Serving size information */
  servingSize?: string;
  /** Calories per serving */
  calories?: number;
  /** Total fat content */
  fatContent?: string;
  /** Saturated fat content */
  saturatedFatContent?: string;
  /** Unsaturated fat content */
  unsaturatedFatContent?: string;
  /** Trans fat content */
  transFatContent?: string;
  /** Carbohydrate content */
  carbohydrateContent?: string;
  /** Sugar content */
  sugarContent?: string;
  /** Protein content */
  proteinContent?: string;
  /** Sodium content */
  sodiumContent?: string;
  /** Fiber content */
  fiberContent?: string;
  /** Cholesterol content */
  cholesterolContent?: string;
  
  // Legacy aliases for backward compatibility
  protein?: string;
  carbohydrates?: string;
  fat?: string;
  fiber?: string;
  sodium?: string;
  sugar?: string;
  cholesterol?: string;
  saturatedFat?: string;
  unsaturatedFat?: string;
  transFat?: string;
}

export interface IngredientGroup {
  /** Purpose or name of the ingredient group (e.g., "For the sauce", "Garnish") */
  purpose: string;
  /** List of ingredients in this group */
  ingredients: string[];
}

export interface RecipeData {
  /** Recipe title */
  title: string;
  /** List of ingredients */
  ingredients: string[];
  /** Cooking instructions as formatted text */
  instructions: string;
  /** Cooking instructions as a list of steps */
  instructionsList?: string[];
  /** Ingredient groups with purposes */
  ingredientGroups?: IngredientGroup[];
  /** Total time in minutes */
  totalTime?: number | null;
  /** Cooking time in minutes */
  cookTime?: number | null;
  /** Preparation time in minutes */
  prepTime?: number | null;
  /** Recipe yield (e.g., "4 servings", "12 cookies") */
  yields?: string | null;
  /** Number of servings */
  servings?: number | null;
  /** Main recipe image URL */
  image?: string | null;
  /** Recipe author */
  author?: string | null;
  /** Recipe description */
  description?: string | null;
  /** Recipe category */
  category?: string | null;
  /** Cuisine type */
  cuisine?: string | null;
  /** Cooking method */
  cookingMethod?: string | null;
  /** Recipe tags/keywords */
  tags?: string[] | null;
  keywords?: string[] | null;
  /** Recipe rating (0-5 scale typically) */
  rating?: number | null;
  ratings?: number | null;
  /** Number of ratings/reviews */
  reviewCount?: number | null;
  ratingsCount?: number | null;
  /** Equipment needed */
  equipment?: string[] | null;
  /** Nutritional information */
  nutrition?: NutritionData | null;
  nutrients?: NutritionData | null;
  /** Dietary restrictions */
  dietaryRestrictions?: string[] | null;
  /** Canonical URL of the recipe */
  canonicalUrl?: string | null;
  /** Website name */
  siteName?: string | null;
  /** Publication date */
  datePublished?: string | null;
  /** Last modified date */
  dateModified?: string | null;
  /** Recipe language */
  language?: string | null;
  /** All links found in the recipe */
  links?: Array<Record<string, string>> | null;
}

export interface ScraperOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** User-Agent header for requests */
  userAgent?: string;
  /** Whether to follow redirects */
  followRedirects?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface ScraperConstructor {
  new (html: string, url: string): AbstractScraper;
  host(): string;
}

export interface AbstractScraper {
  /** Get the hostname this scraper handles */
  host(): string;
  
  // Core recipe data methods
  title(): string;
  ingredients(): string[];
  instructions(): string;
  instructionsList(): string[];
  ingredientGroups(): IngredientGroup[];
  
  // Time-related methods
  totalTime(): number | null;
  cookTime(): number | null;
  prepTime(): number | null;
  
  // Serving information
  yields(): string | null;
  servings(): number | null;
  
  // Media and metadata
  image(): string | null;
  author(): string | null;
  description(): string | null;
  category(): string | null;
  cuisine(): string | null;
  cookingMethod(): string | null;
  
  // Tags and ratings
  tags(): string[] | null;
  keywords(): string[] | null;
  rating(): number | null;
  ratings(): number | null;
  reviewCount(): number | null;
  ratingsCount(): number | null;
  
  // Equipment and nutrition
  equipment(): string[] | null;
  nutrition(): NutritionData | null;
  nutrients(): NutritionData | null;
  dietaryRestrictions(): string[] | null;
  
  // URLs and dates
  canonicalUrl(): string | null;
  siteName(): string | null;
  datePublished(): string | null;
  dateModified(): string | null;
  language(): string | null;
  
  // Utility methods
  links(): Array<Record<string, string>>;
  toJSON(): RecipeData;
}

export type ScraperRegistry = Record<string, ScraperConstructor>;

// Error types
export class RecipeScrapingError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'RecipeScrapingError';
  }
}

export class ElementNotFoundInHtml extends RecipeScrapingError {
  constructor(element?: string) {
    super(`Element not found in HTML: ${element || 'unknown'}`);
    this.name = 'ElementNotFoundInHtml';
  }
}

export class FieldNotProvidedByWebsiteException extends RecipeScrapingError {
  constructor(field: string) {
    super(`Field not provided by website: ${field}`);
    this.name = 'FieldNotProvidedByWebsiteException';
  }
}

export class NoSchemaFoundInWildMode extends RecipeScrapingError {
  constructor() {
    super('No schema found in wild mode');
    this.name = 'NoSchemaFoundInWildMode';
  }
}

export class RecipeSchemaNotFound extends RecipeScrapingError {
  constructor() {
    super('Recipe schema not found');
    this.name = 'RecipeSchemaNotFound';
  }
}

export class StaticValueException extends RecipeScrapingError {
  constructor(message: string) {
    super(`Static value exception: ${message}`);
    this.name = 'StaticValueException';
  }
}

export class WebsiteNotImplementedError extends RecipeScrapingError {
  constructor(website: string) {
    super(`Website not implemented: ${website}`);
    this.name = 'WebsiteNotImplementedError';
  }
}