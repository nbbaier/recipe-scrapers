/**
 * Epicurious scraper
 * Pattern 1: Minimal schema-reliant implementation
 */

import { AbstractScraper } from '../core/AbstractScraper.js';

export class EpicuriousScraper extends AbstractScraper {
  static host(): string {
    return 'epicurious.com';
  }

  host(): string {
    return EpicuriousScraper.host();
  }
}