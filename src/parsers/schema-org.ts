/**
 * Schema.org parser for extracting structured recipe data
 * Port of Python recipe_scrapers/_schemaorg.py
 */

import * as cheerio from 'cheerio';
import { SchemaOrgException } from './errors.js';
import { 
  normalizeString, 
  csvToTags, 
  formatDietName, 
  getMinutes, 
  getYields 
} from '../utils/index.js';

const SCHEMA_ORG_HOST = 'schema.org';

interface SchemaOrgData {
  '@context'?: string;
  '@type'?: string | string[];
  '@id'?: string;
  '@graph'?: SchemaOrgData[];
  [key: string]: any;
}

export class SchemaOrgParser {
  private format: string | null = null;
  private data: SchemaOrgData = {};
  private people: Record<string, SchemaOrgData> = {};
  private ratingsData: Record<string, SchemaOrgData> = {};
  private websiteName: string | null = null;

  constructor(html: string) {
    this.parseHtml(html);
  }

  private containsSchemaType(item: SchemaOrgData, schemaType: string): boolean {
    const itemType = item['@type'] || '';
    const itemTypes = Array.isArray(itemType) ? itemType : [itemType];
    return itemTypes.some(type => 
      typeof type === 'string' && type.toLowerCase().includes(schemaType.toLowerCase())
    );
  }

  private findEntity(item: SchemaOrgData, schemaType: string): SchemaOrgData | null {
    if (this.containsSchemaType(item, schemaType)) {
      return item;
    }

    const graph = item['@graph'];
    if (Array.isArray(graph)) {
      for (const node of graph) {
        if (typeof node === 'object' && node !== null) {
          if (this.containsSchemaType(node, schemaType)) {
            return node;
          }
        }
      }
    }

    return null;
  }

  private parseHtml(html: string): void {
    const $ = cheerio.load(html);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    jsonLdScripts.each((_, element) => {
      try {
        const content = $(element).html();
        if (!content) return;
        
        const jsonData = JSON.parse(content);
        this.processSchemaData(jsonData);
      } catch (error) {
        // Continue processing other scripts if one fails
        console.warn('Failed to parse JSON-LD:', error);
      }
    });

    // Also try to extract from microdata attributes
    this.extractMicrodata($);
  }

  private processSchemaData(data: any): void {
    if (!data) return;

    // Handle arrays of schema data
    if (Array.isArray(data)) {
      data.forEach(item => this.processSchemaData(item));
      return;
    }

    if (typeof data !== 'object') return;

    // Check if this is schema.org data
    const context = data['@context'];
    if (typeof context === 'string' && !context.includes(SCHEMA_ORG_HOST)) {
      return;
    }

    // Extract website data
    const website = this.findEntity(data, 'WebSite');
    if (website && website.name) {
      this.websiteName = website.name;
    }

    // Extract person references
    const person = this.findEntity(data, 'Person');
    if (person) {
      const key = person['@id'] || person.url;
      if (key) {
        this.people[key] = person;
      }
    }

    // Extract ratings data
    const rating = this.findEntity(data, 'AggregateRating');
    if (rating) {
      const ratingId = rating['@id'];
      if (ratingId) {
        this.ratingsData[ratingId] = rating;
      }
    }

    // Extract recipe data
    let recipe = this.findEntity(data, 'Recipe');
    if (!recipe && this.containsSchemaType(data, 'WebPage')) {
      recipe = data.mainEntity;
    }

    if (recipe && this.containsSchemaType(recipe, 'Recipe')) {
      this.data = { ...this.data, ...recipe };
      this.format = 'json-ld';
    }
  }

  private extractMicrodata($: cheerio.CheerioAPI): void {
    // Basic microdata extraction - could be enhanced
    const itemProps = $('[itemtype*="schema.org/Recipe"]');
    if (itemProps.length > 0) {
      // Extract basic microdata properties
      const microdataRecipe: any = {};
      
      itemProps.each((_, element) => {
        const $element = $(element);
        $element.find('[itemprop]').each((_, propElement) => {
          const $prop = $(propElement);
          const propName = $prop.attr('itemprop');
          const propValue = $prop.attr('content') || $prop.text().trim();
          
          if (propName && propValue) {
            microdataRecipe[propName] = propValue;
          }
        });
      });

      if (Object.keys(microdataRecipe).length > 0) {
        this.data = { ...microdataRecipe, ...this.data };
        this.format = this.format || 'microdata';
      }
    }
  }

  siteName(): string {
    if (!this.websiteName) {
      throw new SchemaOrgException('Site name not found in SchemaOrg');
    }
    return normalizeString(this.websiteName);
  }

  language(): string | null {
    return this.data.inLanguage || this.data.language || null;
  }

  title(): string {
    const name = this.data.name;
    if (!name) {
      throw new SchemaOrgException('Recipe title not found in SchemaOrg');
    }
    return normalizeString(String(name));
  }

  category(): string | null {
    const category = this.data.recipeCategory;
    if (!category) return null;
    
    if (Array.isArray(category)) {
      return category.join(',');
    }
    return String(category);
  }

  author(): string | null {
    let author = this.data.author || this.data.Author;
    
    if (Array.isArray(author) && author.length > 0) {
      author = author[0];
    }
    
    if (typeof author === 'object' && author !== null) {
      const authorKey = author['@id'] || author.url;
      if (authorKey && this.people[authorKey]) {
        author = this.people[authorKey];
      }
      
      if (typeof author === 'object' && author.name) {
        author = author.name;
      }
    }
    
    return author ? String(author).trim() : null;
  }

  private readDurationField(key: string): number | null {
    const value = this.data[key];
    if (!value) return null;
    
    if (typeof value === 'string') {
      return getMinutes(value);
    }
    
    // Handle QuantitativeValue objects
    if (typeof value === 'object' && value.maxValue) {
      return getMinutes(String(value.maxValue));
    }
    
    return null;
  }

  totalTime(): number | null {
    const hasTimeInfo = ['totalTime', 'prepTime', 'cookTime'].some(key => key in this.data);
    if (!hasTimeInfo) {
      throw new SchemaOrgException('Cooking time information not found in SchemaOrg');
    }

    const totalTime = this.readDurationField('totalTime');
    if (totalTime) return totalTime;

    const prepTime = this.readDurationField('prepTime') || 0;
    const cookTime = this.readDurationField('cookTime') || 0;
    
    if (prepTime || cookTime) {
      return prepTime + cookTime;
    }
    
    return null;
  }

  cookTime(): number | null {
    if (!('cookTime' in this.data)) {
      throw new SchemaOrgException('Cook time information not found in SchemaOrg');
    }
    return this.readDurationField('cookTime');
  }

  prepTime(): number | null {
    if (!('prepTime' in this.data)) {
      throw new SchemaOrgException('Prep time information not found in SchemaOrg');
    }
    return this.readDurationField('prepTime');
  }

  yields(): string | null {
    const hasYieldInfo = ['recipeYield', 'yield'].some(key => key in this.data);
    if (!hasYieldInfo) {
      throw new SchemaOrgException('Servings information not found in SchemaOrg');
    }

    let yieldData = this.data.recipeYield || this.data.yield;
    if (Array.isArray(yieldData)) {
      yieldData = yieldData[0];
    }
    
    return yieldData ? getYields(String(yieldData)) : null;
  }

  image(): string | null {
    let image = this.data.image;
    if (!image) {
      throw new SchemaOrgException('Image not found in SchemaOrg');
    }

    if (Array.isArray(image)) {
      image = image[0];
    }

    if (typeof image === 'object' && image.url) {
      image = image.url;
    }

    const imageStr = String(image);
    if (!imageStr.includes('http://') && !imageStr.includes('https://')) {
      return ''; // Relative paths, let generic image retrieval handle it
    }

    return imageStr;
  }

  ingredients(): string[] {
    let ingredients = this.data.recipeIngredient || this.data.ingredients || [];

    // Handle nested arrays
    if (Array.isArray(ingredients) && ingredients.length > 0 && Array.isArray(ingredients[0])) {
      ingredients = ingredients.flat();
    }

    if (typeof ingredients === 'string') {
      ingredients = [ingredients];
    }

    return ingredients
      .filter(ingredient => ingredient)
      .map(ingredient => normalizeString(String(ingredient)));
  }

  nutrition(): Record<string, string> {
    const nutrition = this.data.nutrition || {};
    const cleanedNutrition: Record<string, string> = {};

    for (const [key, value] of Object.entries(nutrition)) {
      if (!key || key.startsWith('@') || !value) continue;
      cleanedNutrition[key] = String(value);
    }

    const result: Record<string, string> = {};
    for (const [nutrient, value] of Object.entries(cleanedNutrition)) {
      result[normalizeString(nutrient)] = normalizeString(value);
    }

    return result;
  }

  private extractHowToInstructionsText(schemaItem: any): string[] {
    const instructionsGist: string[] = [];
    
    if (typeof schemaItem === 'string') {
      instructionsGist.push(schemaItem);
    } else if (schemaItem['@type'] === 'HowToStep') {
      if (schemaItem.name) {
        const text = schemaItem.text || '';
        const name = schemaItem.name || '';
        // Only add name if it's different from text
        if (!text.startsWith(name.replace(/\.$/, ''))) {
          instructionsGist.push(name);
        }
      }
      
      if (schemaItem.itemListElement) {
        schemaItem = schemaItem.itemListElement;
      }
      
      if (schemaItem.text) {
        instructionsGist.push(schemaItem.text);
      }
    } else if (schemaItem['@type'] === 'HowToSection') {
      const name = schemaItem.name || schemaItem.Name;
      if (name) {
        instructionsGist.push(name);
      }
      
      if (schemaItem.itemListElement) {
        for (const item of schemaItem.itemListElement) {
          instructionsGist.push(...this.extractHowToInstructionsText(item));
        }
      }
    }
    
    return instructionsGist;
  }

  instructions(): string {
    let instructions = this.data.recipeInstructions || this.data.RecipeInstructions || '';

    // Handle nested arrays
    if (Array.isArray(instructions) && instructions.length > 0 && Array.isArray(instructions[0])) {
      if (instructions.every(item => Array.isArray(item))) {
        instructions = instructions.flat();
      }
    }

    if (typeof instructions === 'object' && !Array.isArray(instructions)) {
      instructions = instructions.itemListElement || instructions;
    }

    if (Array.isArray(instructions)) {
      const instructionsGist: string[] = [];
      
      for (const schemaInstructionItem of instructions) {
        instructionsGist.push(...this.extractHowToInstructionsText(schemaInstructionItem));
      }

      return instructionsGist
        .map(instruction => normalizeString(instruction))
        .join('\n');
    }

    return String(instructions);
  }

  rating(): number | null {
    let ratings = this.data.aggregateRating || this.findEntity(this.data, 'AggregateRating');
    
    if (ratings && typeof ratings === 'object') {
      const ratingId = ratings['@id'];
      if (ratingId && this.ratingsData[ratingId]) {
        ratings = this.ratingsData[ratingId];
      }
    }
    
    if (ratings && typeof ratings === 'object') {
      ratings = ratings.ratingValue;
    }
    
    if (ratings) {
      return Math.round(parseFloat(String(ratings)) * 100) / 100;
    }
    
    throw new SchemaOrgException('No ratingValue in SchemaOrg');
  }

  ratingsCount(): number | null {
    let ratings = this.data.aggregateRating || this.findEntity(this.data, 'AggregateRating');
    
    if (typeof ratings === 'object' && ratings) {
      const ratingId = ratings['@id'];
      if (ratingId && this.ratingsData[ratingId]) {
        ratings = this.ratingsData[ratingId];
      }
      
      const count = ratings.ratingCount || ratings.reviewCount;
      if (count) {
        const numCount = parseFloat(String(count));
        return numCount !== 0 ? Math.floor(numCount) : null;
      }
    }
    
    throw new SchemaOrgException('No ratingCount in SchemaOrg');
  }

  cuisine(): string | null {
    const cuisine = this.data.recipeCuisine;
    if (!cuisine) {
      throw new SchemaOrgException('No cuisine data in SchemaOrg');
    }
    
    if (Array.isArray(cuisine)) {
      return cuisine.join(',');
    }
    
    return String(cuisine);
  }

  description(): string {
    let description = this.data.description;
    if (!description) {
      throw new SchemaOrgException('No description data in SchemaOrg');
    }
    
    if (Array.isArray(description)) {
      description = description[0];
    }
    
    return normalizeString(String(description));
  }

  cookingMethod(): string {
    let cookingMethod = this.data.cookingMethod;
    if (!cookingMethod) {
      throw new SchemaOrgException('No cooking method data in SchemaOrg');
    }
    
    if (Array.isArray(cookingMethod)) {
      cookingMethod = cookingMethod[0];
    }
    
    return normalizeString(String(cookingMethod));
  }

  keywords(): string[] {
    let keywords = this.data.keywords;
    if (!keywords) {
      throw new SchemaOrgException('No keywords data in SchemaOrg');
    }
    
    if (Array.isArray(keywords)) {
      const normalizedKeywords = keywords.map(k => normalizeString(String(k)));
      keywords = normalizedKeywords.join(', ');
    } else {
      keywords = normalizeString(String(keywords));
    }
    
    return csvToTags(String(keywords));
  }

  dietaryRestrictions(): string[] {
    let dietaryRestrictions = this.data.suitableForDiet;
    if (!dietaryRestrictions) {
      throw new SchemaOrgException('No dietary restrictions data in SchemaOrg');
    }
    
    if (!Array.isArray(dietaryRestrictions)) {
      dietaryRestrictions = [dietaryRestrictions];
    }
    
    const formattedDiets = dietaryRestrictions
      .map(diet => formatDietName(String(diet)))
      .filter(Boolean);
    
    const formattedDietsStr = formattedDiets.join(', ');
    return csvToTags(formattedDietsStr);
  }
}