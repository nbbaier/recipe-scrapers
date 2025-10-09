/**
 * OpenGraph parser for extracting basic recipe metadata
 * Port of Python recipe_scrapers/_opengraph.py
 */

import * as cheerio from 'cheerio';
import { OpenGraphException } from './errors.js';

export class OpenGraphParser {
  private $: cheerio.CheerioAPI;

  constructor(html: string) {
    this.$ = cheerio.load(html);
  }

  siteName(): string {
    let meta = this.$('meta[property="og:site_name"]');
    if (meta.length === 0) {
      meta = this.$('meta[name="og:site_name"]');
    }
    
    if (meta.length === 0) {
      throw new OpenGraphException('Site name not found in OpenGraph metadata.');
    }

    const content = meta.attr('content');
    if (!content) {
      throw new OpenGraphException('Site name not found in OpenGraph metadata.');
    }

    return content;
  }

  image(): string {
    const image = this.$('meta[property="og:image"][content]');
    
    if (image.length === 0) {
      throw new OpenGraphException('Image not found in OpenGraph metadata.');
    }

    const content = image.attr('content');
    if (!content) {
      throw new OpenGraphException('Image not found in OpenGraph metadata.');
    }

    return content;
  }

  title(): string | null {
    const title = this.$('meta[property="og:title"]');
    return title.attr('content') || null;
  }

  description(): string | null {
    const description = this.$('meta[property="og:description"]');
    return description.attr('content') || null;
  }

  url(): string | null {
    const url = this.$('meta[property="og:url"]');
    return url.attr('content') || null;
  }

  type(): string | null {
    const type = this.$('meta[property="og:type"]');
    return type.attr('content') || null;
  }
}