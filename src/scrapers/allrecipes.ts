/**
 * AllRecipes scraper
 * Pattern 1: Minimal schema-reliant implementation
 */

import { AbstractScraper } from '../core/AbstractScraper.js';

export class AllRecipesScraper extends AbstractScraper {
  static host(): string {
    return 'allrecipes.com';
  }

  host(): string {
    return AllRecipesScraper.host();
  }
}