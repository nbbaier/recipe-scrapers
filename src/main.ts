/**
 * Main scraping function for easy usage
 */

import { AbstractScraper } from './core/AbstractScraper.js';
import { ScraperRegistry } from './scrapers/registry.js';
import { RecipeData } from './types/index.js';

/**
 * Scrape recipe data from a URL and HTML content
 */
export async function scrapeRecipe(html: string, url: string): Promise<RecipeData> {
  const scraper = ScraperRegistry.createScraper(html, url);
  return scraper.toJSON();
}

/**
 * Get supported domains
 */
export function getSupportedDomains(): string[] {
  return ScraperRegistry.getSupportedDomains();
}

/**
 * Check if a domain is supported
 */
export function isSupported(url: string): boolean {
  return ScraperRegistry.isSupported(url);
}