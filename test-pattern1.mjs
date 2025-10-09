/**
 * Test Pattern 1 scrapers directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScraperRegistry, scrapeRecipe, getSupportedDomains } from './dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPatternOneScrapers() {
  console.log('🧪 Testing Pattern 1 Scrapers\n');

  // Load sample HTML
  const sampleHtml = fs.readFileSync(
    path.join(__dirname, 'src', 'scrapers', 'test-data', 'sample-recipe.html'),
    'utf-8'
  );

  console.log('📊 Supported domains:', getSupportedDomains().length);
  console.log('🌐 Domains:', getSupportedDomains().join(', '));
  console.log('');

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

    try {
      const scraper = ScraperRegistry.createScraper(sampleHtml, testUrl);
      const recipeData = await scrapeRecipe(sampleHtml, testUrl);
      
      console.log(`✅ Scraper: ${scraper.constructor.name}`);
      console.log(`🏠 Host: ${scraper.host()}`);
      console.log(`📋 Title: ${recipeData.title}`);
      console.log(`👨‍🍳 Author: ${recipeData.author || 'N/A'}`);
      console.log(`⏱️  Total Time: ${recipeData.totalTime || 'N/A'} minutes`);
      console.log(`🥘 Servings: ${recipeData.yields || 'N/A'}`);
      console.log(`⭐ Rating: ${recipeData.rating || 'N/A'}/5`);
      console.log(`📊 Rating Count: ${recipeData.reviewCount || 'N/A'}`);
      console.log(`🥕 Ingredients: ${recipeData.ingredients?.length || 0} items`);
      console.log(`📝 Instructions: ${recipeData.instructionsList?.length || 0} steps`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
}

// Run tests
testPatternOneScrapers().catch(console.error);