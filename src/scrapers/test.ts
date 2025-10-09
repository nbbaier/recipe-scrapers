/**
 * Basic test script for Pattern 1 scrapers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScraperRegistry } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPatternOneScrapers() {
  console.log('🧪 Testing Pattern 1 Scrapers\n');

  // Load sample HTML
  const sampleHtml = fs.readFileSync(
    path.join(__dirname, 'test-data', 'sample-recipe.html'),
    'utf-8'
  );

  // Test URLs for different scrapers
  const testUrls = [
    'https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/',
    'https://www.bonappetit.com/recipe/chocolate-chip-cookies',
    'https://www.foodnetwork.com/recipes/chocolate-chip-cookies',
    'https://www.epicurious.com/recipes/chocolate-chip-cookies',
    'https://www.seriouseats.com/chocolate-chip-cookies-recipe',
    'https://www.unknownsite.com/recipe/cookies' // Should use schema fallback
  ];

  for (const testUrl of testUrls) {
    console.log(`\n📝 Testing: ${testUrl}`);
    console.log(`🔍 Supported: ${ScraperRegistry.isSupported(testUrl)}`);

    try {
      const scraper = ScraperRegistry.createScraper(sampleHtml, testUrl);
      
      console.log(`✅ Scraper: ${scraper.constructor.name}`);
      console.log(`🏠 Host: ${scraper.host()}`);
      
      // Test core recipe extraction
      console.log(`📋 Title: ${scraper.title()}`);
      console.log(`👨‍🍳 Author: ${scraper.author()}`);
      console.log(`⏱️  Total Time: ${scraper.totalTime()} minutes`);
      console.log(`🥘 Servings: ${scraper.yields()}`);
      console.log(`⭐ Rating: ${scraper.rating()}/5`);
      console.log(`📊 Rating Count: ${scraper.reviewCount()}`);
      console.log(`🥕 Ingredients: ${scraper.ingredients().length} items`);
      console.log(`📝 Instructions: ${scraper.instructionsList().length} steps`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }

  // Test registry functionality
  console.log('\n🗂️  Registry Information:');
  console.log(`📊 Supported domains: ${ScraperRegistry.getSupportedDomains().length}`);
  console.log(`🌐 Domains: ${ScraperRegistry.getSupportedDomains().join(', ')}`);
}

// Run tests
testPatternOneScrapers().catch(console.error);