/**
 * Recipe Scrapers TypeScript - Main Entry Point
 * 
 * A TypeScript port of the popular Python recipe-scrapers library
 * for extracting recipe data from cooking websites.
 */

// Core types and interfaces
export * from './types/index.js';

// Utility functions
export * from './utils/index.js';

// Schema.org and OpenGraph parsers
export * from './parsers/index.js';

// Core scraper classes
export { AbstractScraper, SchemaScraperFactory } from './core/index.js';

// Individual scrapers and registry
export { 
  ScraperRegistry,
  AllRecipesScraper,
  BonAppetitScraper,
  FoodNetworkScraper,
  EpicuriousScraper,
  SeriousEatsScraper
} from './scrapers/index.js';

// Main scraping functions for convenience
export { scrapeRecipe, getSupportedDomains, isSupported } from './main.js';