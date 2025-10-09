/**
 * Scrapers module exports
 */

export { AbstractScraper } from '../core/AbstractScraper.js';
export { ScraperRegistry } from './registry.js';

// Pattern 1 Scrapers (minimal, schema-reliant)
export { AllRecipesScraper } from './allrecipes.js';
export { BonAppetitScraper } from './bonappetit.js';
export { FoodNetworkScraper } from './foodnetwork.js';
export { EpicuriousScraper } from './epicurious.js';
export { SeriousEatsScraper } from './seriouseats.js';