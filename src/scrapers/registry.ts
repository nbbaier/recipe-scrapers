/**
 * Scraper registry for dynamic scraper loading
 * Handles mapping domains to appropriate scraper classes
 */

import { AbstractScraper } from '../core/AbstractScraper.js';
import { SchemaScraperFactory } from '../core/SchemaScraperFactory.js';
import { getHostName } from '../utils/index.js';

// Import Pattern 1 scrapers
import { AllRecipesScraper } from './allrecipes.js';
import { BonAppetitScraper } from './bonappetit.js';
import { FoodNetworkScraper } from './foodnetwork.js';
import { EpicuriousScraper } from './epicurious.js';
import { SeriousEatsScraper } from './seriouseats.js';

// Scraper constructor type
type ScraperConstructor = {
  new (html: string, url: string): AbstractScraper;
  host(): string;
};

export class ScraperRegistry {
  private static scrapers: Map<string, ScraperConstructor> = new Map();

  /**
   * Initialize the registry with available scrapers
   */
  static initialize(): void {
    this.register(AllRecipesScraper);
    this.register(BonAppetitScraper);
    this.register(FoodNetworkScraper);
    this.register(EpicuriousScraper);
    this.register(SeriousEatsScraper);
  }

  /**
   * Register a scraper class
   */
  static register(scraperClass: ScraperConstructor): void {
    const host = scraperClass.host();
    this.scrapers.set(host, scraperClass);
  }

  /**
   * Get scraper for a given URL
   */
  static getScraper(url: string): ScraperConstructor | null {
    const hostname = getHostName(url);
    
    // Direct hostname match
    if (this.scrapers.has(hostname)) {
      return this.scrapers.get(hostname)!;
    }

    // Try without www prefix
    const withoutWww = hostname.replace(/^www\./, '');
    if (this.scrapers.has(withoutWww)) {
      return this.scrapers.get(withoutWww)!;
    }

    // Try with www prefix
    const withWww = `www.${hostname}`;
    if (this.scrapers.has(withWww)) {
      return this.scrapers.get(withWww)!;
    }

    return null;
  }

  /**
   * Create scraper instance for URL and HTML
   */
  static createScraper(html: string, url: string): AbstractScraper {
    const ScraperClass = this.getScraper(url);
    
    if (ScraperClass) {
      return new ScraperClass(html, url);
    }

    // Fallback to schema-based scraper
    return SchemaScraperFactory.generate(html, url);
  }

  /**
   * Get list of supported domains
   */
  static getSupportedDomains(): string[] {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Check if domain is supported
   */
  static isSupported(url: string): boolean {
    return this.getScraper(url) !== null;
  }
}

// Initialize the registry
ScraperRegistry.initialize();