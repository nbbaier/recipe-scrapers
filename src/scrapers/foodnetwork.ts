/**
 * Food Network scraper
 * Pattern 1: Minimal schema-reliant implementation
 */

import { AbstractScraper } from '../core/AbstractScraper.js';

export class FoodNetworkScraper extends AbstractScraper {
  static host(): string {
    return 'foodnetwork.com';
  }

  host(): string {
    return FoodNetworkScraper.host();
  }
}