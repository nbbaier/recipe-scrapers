/**
 * Serious Eats scraper
 * Pattern 1: Minimal schema-reliant implementation
 */

import { AbstractScraper } from '../core/AbstractScraper.js';

export class SeriousEatsScraper extends AbstractScraper {
  static host(): string {
    return 'seriouseats.com';
  }

  host(): string {
    return SeriousEatsScraper.host();
  }
}