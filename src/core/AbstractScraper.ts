/**
 * Abstract base class for all recipe scrapers
 * Port of Python recipe_scrapers/_abstract.py
 */

import * as cheerio from 'cheerio';
import { SchemaOrgParser, OpenGraphParser } from '../parsers/index.js';
import { 
  normalizeString, 
  getMinutes, 
  getYields,
  getHostName,
  getEquipment
} from '../utils/index.js';
import { 
  RecipeData, 
  NutritionData, 
  IngredientGroup,
  ElementNotFoundInHtml,
  FieldNotProvidedByWebsiteException 
} from '../types/index.js';

// User-Agent header similar to Python version
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Windows NT 10.0; Win64; x64; rv:1.0.0) recipe-scrapers-ts/1.0.0'
};

export abstract class AbstractScraper {
  protected html: string;
  protected url: string;
  protected $: cheerio.CheerioAPI;
  protected schemaOrg: SchemaOrgParser;
  protected openGraph: OpenGraphParser;

  constructor(html: string, url: string) {
    this.html = html;
    this.url = url;
    this.$ = cheerio.load(html);
    this.schemaOrg = new SchemaOrgParser(html);
    this.openGraph = new OpenGraphParser(html);
  }

  /**
   * Get the hostname this scraper handles - must be implemented by subclasses
   */
  abstract host(): string;

  /**
   * Static method to get hostname - must be implemented by subclasses
   */
  static host(): string {
    throw new Error('Static host() method must be implemented by subclasses');
  }

  // =============================================================================
  // Core recipe data methods with fallback chain: custom -> schema.org -> opengraph
  // =============================================================================

  title(): string {
    try {
      return this.titleFromSelector();
    } catch {
      try {
        return this.schemaOrg.title();
      } catch {
        try {
          const ogTitle = this.openGraph.title();
          if (ogTitle) return ogTitle;
        } catch {
          // Continue to throw error
        }
        throw new ElementNotFoundInHtml('title');
      }
    }
  }

  ingredients(): string[] {
    try {
      return this.ingredientsFromSelector();
    } catch {
      try {
        return this.schemaOrg.ingredients();
      } catch {
        throw new ElementNotFoundInHtml('ingredients');
      }
    }
  }

  instructions(): string {
    try {
      return this.instructionsFromSelector();
    } catch {
      try {
        return this.schemaOrg.instructions();
      } catch {
        throw new ElementNotFoundInHtml('instructions');
      }
    }
  }

  instructionsList(): string[] {
    const instructionsText = this.instructions();
    return instructionsText
      .split('\n')
      .map(instruction => instruction.trim())
      .filter(instruction => instruction.length > 0);
  }

  totalTime(): number | null {
    try {
      return this.totalTimeFromSelector();
    } catch {
      try {
        return this.schemaOrg.totalTime();
      } catch {
        return null;
      }
    }
  }

  cookTime(): number | null {
    try {
      return this.cookTimeFromSelector();
    } catch {
      try {
        return this.schemaOrg.cookTime();
      } catch {
        return null;
      }
    }
  }

  prepTime(): number | null {
    try {
      return this.prepTimeFromSelector();
    } catch {
      try {
        return this.schemaOrg.prepTime();
      } catch {
        return null;
      }
    }
  }

  yields(): string | null {
    try {
      return this.yieldsFromSelector();
    } catch {
      try {
        return this.schemaOrg.yields();
      } catch {
        return null;
      }
    }
  }

  servings(): number | null {
    const yieldsStr = this.yields();
    if (!yieldsStr) return null;
    
    const match = yieldsStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  image(): string | null {
    try {
      return this.imageFromSelector();
    } catch {
      try {
        return this.schemaOrg.image();
      } catch {
        try {
          return this.openGraph.image();
        } catch {
          return null;
        }
      }
    }
  }

  author(): string | null {
    try {
      return this.authorFromSelector();
    } catch {
      try {
        return this.schemaOrg.author();
      } catch {
        return null;
      }
    }
  }

  description(): string | null {
    try {
      return this.descriptionFromSelector();
    } catch {
      try {
        return this.schemaOrg.description();
      } catch {
        try {
          return this.openGraph.description();
        } catch {
          return null;
        }
      }
    }
  }

  category(): string | null {
    try {
      return this.categoryFromSelector();
    } catch {
      try {
        return this.schemaOrg.category();
      } catch {
        return null;
      }
    }
  }

  cuisine(): string | null {
    try {
      return this.cuisineFromSelector();
    } catch {
      try {
        return this.schemaOrg.cuisine();
      } catch {
        return null;
      }
    }
  }

  cookingMethod(): string | null {
    try {
      return this.cookingMethodFromSelector();
    } catch {
      try {
        return this.schemaOrg.cookingMethod();
      } catch {
        return null;
      }
    }
  }

  tags(): string[] | null {
    try {
      return this.tagsFromSelector();
    } catch {
      try {
        return this.keywords();
      } catch {
        return null;
      }
    }
  }

  keywords(): string[] | null {
    try {
      return this.keywordsFromSelector();
    } catch {
      try {
        return this.schemaOrg.keywords();
      } catch {
        return null;
      }
    }
  }

  rating(): number | null {
    try {
      return this.ratingFromSelector();
    } catch {
      try {
        return this.schemaOrg.rating();
      } catch {
        return null;
      }
    }
  }

  // Alias for backward compatibility
  ratings(): number | null {
    return this.rating();
  }

  reviewCount(): number | null {
    try {
      return this.reviewCountFromSelector();
    } catch {
      try {
        return this.schemaOrg.ratingsCount();
      } catch {
        return null;
      }
    }
  }

  // Alias for backward compatibility
  ratingsCount(): number | null {
    return this.reviewCount();
  }

  equipment(): string[] | null {
    try {
      const equipmentList = this.equipmentFromSelector();
      return equipmentList ? getEquipment(equipmentList) : null;
    } catch {
      return null;
    }
  }

  nutrition(): NutritionData | null {
    try {
      return this.nutritionFromSelector();
    } catch {
      try {
        const nutrition = this.schemaOrg.nutrition();
        return Object.keys(nutrition).length > 0 ? nutrition as NutritionData : null;
      } catch {
        return null;
      }
    }
  }

  // Alias for backward compatibility
  nutrients(): NutritionData | null {
    return this.nutrition();
  }

  dietaryRestrictions(): string[] | null {
    try {
      return this.dietaryRestrictionsFromSelector();
    } catch {
      try {
        return this.schemaOrg.dietaryRestrictions();
      } catch {
        return null;
      }
    }
  }

  canonicalUrl(): string | null {
    try {
      return this.canonicalUrlFromSelector();
    } catch {
      // Look for canonical link tag
      const canonical = this.$('link[rel="canonical"][href]');
      if (canonical.length > 0) {
        const href = canonical.attr('href');
        if (href) {
          return this.makeAbsoluteUrl(href);
        }
      }
      
      try {
        return this.openGraph.url();
      } catch {
        return this.url;
      }
    }
  }

  siteName(): string | null {
    try {
      return this.siteNameFromSelector();
    } catch {
      try {
        return this.schemaOrg.siteName();
      } catch {
        try {
          return this.openGraph.siteName();
        } catch {
          return null;
        }
      }
    }
  }

  datePublished(): string | null {
    try {
      return this.datePublishedFromSelector();
    } catch {
      return null;
    }
  }

  dateModified(): string | null {
    try {
      return this.dateModifiedFromSelector();
    } catch {
      return null;
    }
  }

  language(): string | null {
    try {
      return this.languageFromSelector();
    } catch {
      try {
        return this.schemaOrg.language();
      } catch {
        // Try HTML lang attribute
        const html = this.$('html[lang]');
        const lang = html.attr('lang');
        if (lang) return lang;
        
        // Try meta content-language
        const metaLang = this.$('meta[http-equiv="content-language"][content]');
        const content = metaLang.attr('content');
        if (content) {
          return content.split(',')[0]?.trim() || null;
        }
        
        return null;
      }
    }
  }

  ingredientGroups(): IngredientGroup[] {
    try {
      return this.ingredientGroupsFromSelector();
    } catch {
      // Fallback: create a single group with all ingredients
      const ingredients = this.ingredients();
      if (ingredients.length > 0) {
        return [{
          purpose: 'Ingredients',
          ingredients: ingredients
        }];
      }
      return [];
    }
  }

  links(): Array<Record<string, string>> {
    const invalidHref = new Set(['#', '']);
    const linksHtml = this.$('a[href]');
    
    const links: Array<Record<string, string>> = [];
    linksHtml.each((_, element) => {
      const $link = this.$(element);
      const href = $link.attr('href');
      
      if (href && !invalidHref.has(href)) {
        const linkData: Record<string, string> = {};
        
        // Get all attributes
        const attrs = element.attribs;
        for (const [key, value] of Object.entries(attrs)) {
          linkData[key] = value;
        }
        
        links.push(linkData);
      }
    });
    
    return links;
  }

  // =============================================================================
  // Abstract methods that must be implemented by subclasses
  // =============================================================================

  protected titleFromSelector(): string {
    throw new FieldNotProvidedByWebsiteException('title');
  }

  protected ingredientsFromSelector(): string[] {
    throw new FieldNotProvidedByWebsiteException('ingredients');
  }

  protected instructionsFromSelector(): string {
    throw new FieldNotProvidedByWebsiteException('instructions');
  }

  protected totalTimeFromSelector(): number | null {
    throw new FieldNotProvidedByWebsiteException('totalTime');
  }

  protected cookTimeFromSelector(): number | null {
    throw new FieldNotProvidedByWebsiteException('cookTime');
  }

  protected prepTimeFromSelector(): number | null {
    throw new FieldNotProvidedByWebsiteException('prepTime');
  }

  protected yieldsFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('yields');
  }

  protected imageFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('image');
  }

  protected authorFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('author');
  }

  protected descriptionFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('description');
  }

  protected categoryFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('category');
  }

  protected cuisineFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('cuisine');
  }

  protected cookingMethodFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('cookingMethod');
  }

  protected tagsFromSelector(): string[] | null {
    throw new FieldNotProvidedByWebsiteException('tags');
  }

  protected keywordsFromSelector(): string[] | null {
    throw new FieldNotProvidedByWebsiteException('keywords');
  }

  protected ratingFromSelector(): number | null {
    throw new FieldNotProvidedByWebsiteException('rating');
  }

  protected reviewCountFromSelector(): number | null {
    throw new FieldNotProvidedByWebsiteException('reviewCount');
  }

  protected equipmentFromSelector(): string[] | null {
    throw new FieldNotProvidedByWebsiteException('equipment');
  }

  protected nutritionFromSelector(): NutritionData | null {
    throw new FieldNotProvidedByWebsiteException('nutrition');
  }

  protected dietaryRestrictionsFromSelector(): string[] | null {
    throw new FieldNotProvidedByWebsiteException('dietaryRestrictions');
  }

  protected canonicalUrlFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('canonicalUrl');
  }

  protected siteNameFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('siteName');
  }

  protected datePublishedFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('datePublished');
  }

  protected dateModifiedFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('dateModified');
  }

  protected languageFromSelector(): string | null {
    throw new FieldNotProvidedByWebsiteException('language');
  }

  protected ingredientGroupsFromSelector(): IngredientGroup[] {
    throw new FieldNotProvidedByWebsiteException('ingredientGroups');
  }

  // =============================================================================
  // Utility methods
  // =============================================================================

  protected normalize(text: string): string {
    return normalizeString(text);
  }

  protected getMinutes(timeStr: string | cheerio.Cheerio<cheerio.Element>): number | null {
    return getMinutes(timeStr);
  }

  protected makeAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      const protocol = this.url.startsWith('https:') ? 'https:' : 'http:';
      return `${protocol}${url}`;
    }
    
    if (url.startsWith('/')) {
      const urlObj = new URL(this.url);
      return `${urlObj.protocol}//${urlObj.host}${url}`;
    }
    
    // Relative URL
    const urlObj = new URL(this.url);
    const pathParts = urlObj.pathname.split('/');
    pathParts.pop(); // Remove filename
    pathParts.push(url);
    return `${urlObj.protocol}//${urlObj.host}${pathParts.join('/')}`;
  }

  protected getHostName(): string {
    return getHostName(this.url);
  }

  // =============================================================================
  // JSON export
  // =============================================================================

  toJSON(): RecipeData {
    const jsonData: RecipeData = {
      title: '',
      ingredients: [],
      instructions: ''
    };

    // Get all public method names that don't start with _ and aren't excluded
    const excludedMethods = new Set(['links', 'toJSON', 'host']);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(name => {
        const method = (this as any)[name];
        return typeof method === 'function' && 
               !name.startsWith('_') && 
               !name.includes('FromSelector') &&
               !excludedMethods.has(name);
      });

    for (const methodName of methods) {
      try {
        const method = (this as any)[methodName];
        if (typeof method === 'function') {
          const result = method.call(this);
          
          if (methodName === 'ingredientGroups') {
            // Special handling for ingredient groups
            (jsonData as any)[methodName] = result?.map((group: IngredientGroup) => ({
              purpose: group.purpose,
              ingredients: group.ingredients
            })) || [];
          } else {
            (jsonData as any)[methodName] = result;
          }
        }
      } catch {
        // Skip methods that throw errors
      }
    }

    return jsonData;
  }

  // =============================================================================
  // Static helper methods
  // =============================================================================

  static getHeaders(): Record<string, string> {
    return { ...HEADERS };
  }
}