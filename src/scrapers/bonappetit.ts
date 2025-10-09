/**
 * Bon Appetit scraper
 * Pattern 1: Minimal schema-reliant implementation
 */

import { AbstractScraper } from '../core/AbstractScraper.js';

export class BonAppetitScraper extends AbstractScraper {
  static host(): string {
    return 'bonappetit.com';
  }

  host(): string {
    return BonAppetitScraper.host();
  }
}