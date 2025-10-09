/**
 * Factory for creating dynamic scrapers from Schema.org data
 * Port of Python recipe_scrapers/_factory.py
 */

import { AbstractScraper } from './AbstractScraper.js';
import { getHostName } from '../utils/index.js';

export class SchemaScraperFactory {
  /**
   * Dynamic scraper class that relies entirely on Schema.org data
   */
  static SchemaScraper = class extends AbstractScraper {
    host(): string {
      return this.url ? getHostName(this.url) : '';
    }

    static host(): string {
      return ''; // Dynamic scraper doesn't have a fixed host
    }

    // Override all methods to use Schema.org data directly
    // This bypasses the fallback chain and goes straight to schema data

    title(): string {
      return this.schemaOrg.title();
    }

    category(): string | null {
      try {
        return this.schemaOrg.category();
      } catch {
        return null;
      }
    }

    totalTime(): number | null {
      try {
        return this.schemaOrg.totalTime();
      } catch {
        return null;
      }
    }

    cookTime(): number | null {
      try {
        return this.schemaOrg.cookTime();
      } catch {
        return null;
      }
    }

    prepTime(): number | null {
      try {
        return this.schemaOrg.prepTime();
      } catch {
        return null;
      }
    }

    yields(): string | null {
      try {
        return this.schemaOrg.yields();
      } catch {
        return null;
      }
    }

    image(): string | null {
      try {
        return this.schemaOrg.image();
      } catch {
        return null;
      }
    }

    ingredients(): string[] {
      return this.schemaOrg.ingredients();
    }

    instructions(): string {
      return this.schemaOrg.instructions();
    }

    rating(): number | null {
      try {
        return this.schemaOrg.rating();
      } catch {
        return null;
      }
    }

    // Alias for backward compatibility
    ratings(): number | null {
      return this.rating();
    }

    author(): string | null {
      try {
        return this.schemaOrg.author();
      } catch {
        return null;
      }
    }

    cuisine(): string | null {
      try {
        return this.schemaOrg.cuisine();
      } catch {
        return null;
      }
    }

    description(): string | null {
      try {
        return this.schemaOrg.description();
      } catch {
        return null;
      }
    }

    cookingMethod(): string | null {
      try {
        return this.schemaOrg.cookingMethod();
      } catch {
        return null;
      }
    }

    keywords(): string[] | null {
      try {
        return this.schemaOrg.keywords();
      } catch {
        return null;
      }
    }

    dietaryRestrictions(): string[] | null {
      try {
        return this.schemaOrg.dietaryRestrictions();
      } catch {
        return null;
      }
    }

    reviewCount(): number | null {
      try {
        return this.schemaOrg.ratingsCount();
      } catch {
        return null;
      }
    }

    // Alias for backward compatibility
    ratingsCount(): number | null {
      return this.reviewCount();
    }

    siteName(): string | null {
      try {
        return this.schemaOrg.siteName();
      } catch {
        return super.siteName(); // Fall back to parent implementation
      }
    }

    language(): string | null {
      try {
        return this.schemaOrg.language();
      } catch {
        return super.language(); // Fall back to parent implementation
      }
    }
  };

  /**
   * Generate a schema-based scraper instance
   */
  static generate(html: string, url: string): AbstractScraper {
    return new this.SchemaScraper(html, url);
  }
}