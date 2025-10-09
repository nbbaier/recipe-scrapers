/**
 * Utility functions for the recipe-scrapers library
 * Port of Python recipe_scrapers/_utils.py with TypeScript enhancements
 */

import * as cheerio from 'cheerio';
import { parse as parseISO8601Duration } from 'iso8601-duration';

// Unicode fraction mappings
const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// Time parsing regex
const TIME_REGEX = /(?:\D*(?<days>\d+)\s*(?:days|D))?(?:\D*(?<hours>[\d.\s/?¼½¾⅓⅔⅕⅖⅗]+)\s*(?:hours|hrs|hr|h|óra|:))?(?:\D*(?<minutes>\d+)\s*(?:minutes|mins|min|m|perc|$))?(?:\D*(?<seconds>\d+)\s*(?:seconds|secs|sec|s))?/i;

// Serving regex patterns
const SERVE_REGEX_NUMBER = /(\D*(?<items>\d+(\.\d*)?)?.*)/;
const SERVE_REGEX_ITEMS = /\bsandwiches\b|\btacquitos\b|\bmakes\b|\bcups\b|\bappetizer\b|\bporzioni\b|\bcookies\b|\b(large |small )?buns\b/i;
const SERVE_REGEX_TO = /\d+(\s+to\s+|-)\d+/i;

// Recipe yield types (singular, plural)
const RECIPE_YIELD_TYPES: Array<[string, string]> = [
  ['dozen', 'dozen'],
  ['batch', 'batches'],
  ['cake', 'cakes'],
  ['sandwich', 'sandwiches'],
  ['bun', 'buns'],
  ['cookie', 'cookies'],
  ['muffin', 'muffins'],
  ['cupcake', 'cupcakes'],
  ['loaf', 'loaves'],
  ['pie', 'pies'],
  ['cup', 'cups'],
  ['pint', 'pints'],
  ['gallon', 'gallons'],
  ['ounce', 'ounces'],
  ['pound', 'pounds'],
  ['gram', 'grams'],
  ['liter', 'liters'],
  ['piece', 'pieces'],
  ['layer', 'layers'],
  ['scoop', 'scoops'],
  ['bar', 'bars'],
  ['patty', 'patties'],
  ['hamburger bun', 'hamburger buns'],
  ['pancake', 'pancakes'],
  ['item', 'items'],
];

/**
 * Format diet name from schema.org format to human readable
 */
export function formatDietName(dietInput: string): string | null {
  const replacements: Record<string, string> = {
    'DiabeticDiet': 'Diabetic Diet',
    'GlutenFreeDiet': 'Gluten Free Diet',
    'HalalDiet': 'Halal Diet',
    'HinduDiet': 'Hindu Diet',
    'KosherDiet': 'Kosher Diet',
    'LowCalorieDiet': 'Low Calorie Diet',
    'LowFatDiet': 'Low Fat Diet',
    'LowLactoseDiet': 'Low Lactose Diet',
    'LowSaltDiet': 'Low Salt Diet',
    'VeganDiet': 'Vegan Diet',
    'VegetarianDiet': 'Vegetarian Diet',
  };

  let diet = dietInput;
  if (diet.includes('schema.org/')) {
    diet = diet.split('schema.org/').pop() || '';
  }

  // Exclude results that are just "schema.org/"
  if (diet.trim() === '') {
    return null;
  }

  for (const [key, value] of Object.entries(replacements)) {
    if (diet.includes(key)) {
      return value;
    }
  }

  return diet;
}

/**
 * Extract fractional values from text including unicode fractions
 */
function extractFractional(inputString: string): number {
  const input = inputString.trim();

  // Handle mixed numbers with unicode fractions e.g., '1⅔'
  for (const [unicodeFraction, fractionValue] of Object.entries(FRACTIONS)) {
    if (input.includes(unicodeFraction)) {
      const wholePart = input.split(unicodeFraction)[0];
      const wholeNumber = parseFloat(wholePart || '0');
      return wholeNumber + fractionValue;
    }
  }

  // Pure unicode fraction
  if (input in FRACTIONS) {
    return FRACTIONS[input];
  }

  // Try simple float parsing
  try {
    return parseFloat(input);
  } catch {
    // Continue to fraction parsing
  }

  // Mixed fraction e.g., "1 1/2"
  if (input.includes(' ') && input.includes('/')) {
    const [wholePart, fractionalPart] = input.split(' ', 2);
    const [numerator, denominator] = fractionalPart.split('/');
    return parseFloat(wholePart) + parseFloat(numerator) / parseFloat(denominator);
  }

  // Simple fraction e.g., "3/4"
  if (input.includes('/')) {
    const [numerator, denominator] = input.split('/');
    return parseFloat(numerator) / parseFloat(denominator);
  }

  throw new Error(`Unrecognized fraction format: '${input}'`);
}

/**
 * Parse time elements and return minutes
 */
export function getMinutes(element: string | cheerio.Cheerio<cheerio.Element> | null): number | null {
  if (element === null || element === undefined) {
    return null;
  }

  let timeText: string;
  if (typeof element === 'string') {
    timeText = element;
  } else {
    timeText = element.text();
  }

  // Try simple integer parsing first
  const simpleNumber = parseInt(timeText);
  if (!isNaN(simpleNumber)) {
    return simpleNumber;
  }

  // Handle range formats like "12-15 minutes" or "12 to 15 minutes"
  if (timeText.includes('-')) {
    timeText = timeText.split('-')[1] || timeText;
  }
  if (timeText.includes(' to ')) {
    timeText = timeText.split(' to ')[1] || timeText;
  }

  // Attempt ISO8601 duration parsing
  if (timeText.startsWith('P') && timeText.includes('T')) {
    try {
      const duration = parseISO8601Duration(timeText);
      const totalMinutes = Math.ceil(
        (duration.hours || 0) * 60 + 
        (duration.minutes || 0) + 
        (duration.seconds || 0) / 60 + 
        (duration.days || 0) * 24 * 60
      );
      return totalMinutes === 0 ? null : totalMinutes;
    } catch {
      // Continue to regex parsing
    }
  }

  const match = TIME_REGEX.exec(timeText);
  if (!match || !match.groups) {
    return null;
  }

  const { days, hours, minutes, seconds } = match.groups;

  const daysNum = days ? parseFloat(days) : 0;
  const hoursNum = hours ? extractFractional(hours) : 0;
  const minutesNum = minutes ? parseFloat(minutes) : 0;
  const secondsNum = seconds ? parseFloat(seconds) : 0;

  const totalMinutes = minutesNum + (hoursNum * 60) + (daysNum * 24 * 60) + (secondsNum / 60);
  const roundedMinutes = Math.round(totalMinutes);
  return roundedMinutes === 0 ? null : roundedMinutes;
}

/**
 * Extract yield information (servings or items)
 */
export function getYields(element: string | cheerio.Cheerio<cheerio.Element> | null): string {
  if (element === null || element === undefined) {
    throw new Error('Element is null or undefined');
  }

  let serveText: string;
  if (typeof element === 'string') {
    serveText = element;
  } else {
    serveText = element.text();
  }

  if (!serveText) {
    throw new Error('Cannot extract yield information from empty string');
  }

  // Handle range formats
  if (SERVE_REGEX_TO.test(serveText)) {
    const parts = serveText.split(SERVE_REGEX_TO.exec(serveText)?.[1] || '');
    serveText = parts[1] || serveText;
  }

  const match = SERVE_REGEX_NUMBER.exec(serveText);
  const matched = match?.groups?.items || '0';
  const serveTextLower = serveText.toLowerCase();

  let bestMatch: string | null = null;
  let bestMatchLength = 0;

  // Find the best matching yield type
  for (const [singular, plural] of RECIPE_YIELD_TYPES) {
    if (serveTextLower.includes(singular) || serveTextLower.includes(plural)) {
      const matchLength = serveTextLower.includes(singular) ? singular.length : plural.length;
      if (matchLength > bestMatchLength) {
        bestMatchLength = matchLength;
        const count = parseInt(matched);
        bestMatch = `${matched} ${count === 1 ? singular : plural}`;
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  const count = parseFloat(matched);
  const plural = (count > 1 || count === 0) ? 's' : '';

  if (SERVE_REGEX_ITEMS.test(serveText)) {
    return `${matched} item${plural}`;
  }

  return `${matched} serving${plural}`;
}

/**
 * Remove duplicates from equipment list while preserving order
 */
export function getEquipment(equipmentItems: string[]): string[] {
  return Array.from(new Set(equipmentItems));
}

/**
 * Normalize HTML text by removing tags and cleaning whitespace
 */
export function normalizeString(text: string): string {
  // Decode HTML entities
  const unescaped = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Remove HTML tags
  const noHtml = unescaped.replace(/<[^>]*>/g, '');

  // Clean up whitespace and special characters
  let cleaned = noHtml
    .replace(/\xc2\xa0/g, ' ')  // non-breaking space
    .replace(/\xa0/g, ' ')      // non-breaking space
    .replace(/\u200b/g, '')     // zero-width space
    .replace(/\r\n/g, ' ')      // Windows line endings
    .replace(/\n/g, ' ')        // Unix line endings
    .replace(/\t/g, ' ')        // tabs
    .replace(/u0026#039;/g, "'"); // encoded apostrophe

  // Handle double parentheses
  if (cleaned.includes('((') && cleaned.includes('))')) {
    cleaned = cleaned.replace(/\(\(/g, '(').replace(/\)\)/g, ')');
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Convert CSV string to array of tags
 */
export function csvToTags(csv: string, lowercase = false): string[] {
  const rawTags = csv.split(',');
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of rawTags) {
    const tag = rawTag.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(lowercase ? tag.toLowerCase() : tag);
    }
  }

  return tags;
}

/**
 * Parse URL into components
 */
export function urlPathToDict(path: string): Record<string, string | undefined> {
  const pattern = /^((?<schema>.+?):\/\/)?((?<user>.+?)(:(?<password>.*?))?@)?(?<host>[^:/]+)(:(?<port>\d+?))?(?<path>\/.*?)?(?<query>\?.*?)?$/;
  const match = pattern.exec(path);
  return match?.groups || {};
}

/**
 * Extract hostname from URL
 */
export function getHostName(url: string): string {
  const cleanedUrl = url.replace('://www.', '://');
  const parsed = urlPathToDict(cleanedUrl);
  return parsed.host || '';
}

/**
 * Recursively replace keys in object using converter function
 */
export function changeKeys<T>(obj: T, convert: (key: string) => string): T {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[convert(key)] = changeKeys(value, convert);
    }
    return result;
  } else if (Array.isArray(obj)) {
    return obj.map(item => changeKeys(item, convert)) as T;
  } else {
    return obj;
  }
}

/**
 * Extract URL slug (last path segment)
 */
export function getUrlSlug(url: string): string {
  const parsed = urlPathToDict(url);
  const path = parsed.path || '';
  return path.split('/').pop() || '';
}

/**
 * Get nutrition data keys
 */
export function getNutritionKeys(): string[] {
  return [
    'servingSize',
    'calories',
    'fatContent',
    'saturatedFatContent',
    'unsaturatedFatContent',
    'transFatContent',
    'carbohydrateContent',
    'sugarContent',
    'proteinContent',
    'sodiumContent',
    'fiberContent',
    'cholesterolContent',
  ];
}