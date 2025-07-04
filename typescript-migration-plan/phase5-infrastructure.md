# Phase 5: Infrastructure & Deployment

**Duration**: 2-4 weeks
**Status**: ⏳ Pending Phase 4

## Overview

Finalize the infrastructure, packaging, documentation, and deployment pipelines to ensure a production-ready TypeScript library.

## Deliverables

### 5.1 Package Structure & Build System

#### Final Package Structure

```
recipe-scrapers-ts/
├── src/
│   ├── core/                    # Core abstract classes
│   │   ├── AbstractScraper.ts
│   │   ├── PluginManager.ts
│   │   └── index.ts
│   ├── scrapers/               # Individual scraper implementations
│   │   ├── allrecipes.ts
│   │   ├── foodnetwork.ts
│   │   ├── bbcgoodfood.ts
│   │   └── ... (500+ scrapers)
│   ├── parsers/               # Parsing utilities
│   │   ├── SchemaOrgParser.ts
│   │   ├── OpenGraphParser.ts
│   │   └── index.ts
│   ├── plugins/               # Built-in plugins
│   │   ├── HtmlTagStripper.ts
│   │   ├── TextNormalizer.ts
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── time.ts
│   │   ├── text.ts
│   │   ├── nutrition.ts
│   │   └── index.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── Recipe.ts
│   │   ├── Scraper.ts
│   │   ├── Plugin.ts
│   │   └── index.ts
│   ├── browser/               # Browser-specific builds
│   │   ├── index.ts
│   │   └── BrowserScraper.ts
│   └── index.ts               # Main entry point
├── dist/                      # Built packages
│   ├── esm/                   # ES modules
│   ├── cjs/                   # CommonJS
│   ├── browser/               # Browser bundle
│   └── types/                 # TypeScript declarations
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── data/                  # Test HTML files
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── guides/                # User guides
│   └── examples/              # Code examples
├── scripts/                   # Build and utility scripts
│   ├── build.ts
│   ├── test.ts
│   └── generate-docs.ts
├── benchmarks/                # Performance benchmarks
├── .github/                   # GitHub workflows
│   └── workflows/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

#### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
   plugins: [
      dts({
         insertTypesEntry: true,
         rollupTypes: true,
      }),
   ],
   build: {
      lib: {
         entry: {
            index: resolve(__dirname, "src/index.ts"),
            browser: resolve(__dirname, "src/browser/index.ts"),
         },
         formats: ["es", "cjs", "umd"],
         fileName: (format, entryName) => {
            const ext = format === "es" ? "mjs" : "js";
            return `${entryName}.${format}.${ext}`;
         },
      },
      rollupOptions: {
         external: ["cheerio", "node-fetch", "dayjs"],
         output: {
            globals: {
               cheerio: "cheerio",
               "node-fetch": "fetch",
               dayjs: "dayjs",
            },
         },
      },
      target: "es2020",
      minify: "terser",
      sourcemap: true,
   },
   resolve: {
      alias: {
         "@": resolve(__dirname, "src"),
      },
   },
});
```

#### Package.json Configuration

```json
{
   "name": "@recipe-scrapers/core",
   "version": "1.0.0",
   "description": "TypeScript library for extracting recipe data from cooking websites",
   "keywords": ["recipe", "scraper", "typescript", "cooking", "food", "parser"],
   "author": "Recipe Scrapers Team",
   "license": "MIT",
   "repository": {
      "type": "git",
      "url": "https://github.com/hhursev/recipe-scrapers-ts.git"
   },
   "main": "./dist/index.cjs.js",
   "module": "./dist/index.es.mjs",
   "browser": "./dist/browser.umd.js",
   "types": "./dist/index.d.ts",
   "exports": {
      ".": {
         "import": "./dist/index.es.mjs",
         "require": "./dist/index.cjs.js",
         "types": "./dist/index.d.ts"
      },
      "./browser": {
         "import": "./dist/browser.es.mjs",
         "require": "./dist/browser.cjs.js",
         "types": "./dist/browser.d.ts"
      }
   },
   "files": ["dist", "README.md", "LICENSE"],
   "scripts": {
      "build": "vite build",
      "test": "vitest",
      "test:coverage": "vitest --coverage",
      "test:e2e": "playwright test",
      "lint": "eslint src --ext .ts",
      "lint:fix": "eslint src --ext .ts --fix",
      "typecheck": "tsc --noEmit",
      "docs:build": "typedoc src/index.ts",
      "docs:serve": "vitepress dev docs",
      "benchmark": "tsx scripts/benchmark.ts",
      "prepublishOnly": "npm run build && npm run test && npm run typecheck"
   },
   "dependencies": {
      "cheerio": "^1.0.0-rc.12",
      "dayjs": "^1.11.10"
   },
   "peerDependencies": {
      "node-fetch": "^3.3.2"
   },
   "devDependencies": {
      "@types/node": "^20.10.0",
      "@typescript-eslint/eslint-plugin": "^6.13.0",
      "@typescript-eslint/parser": "^6.13.0",
      "eslint": "^8.54.0",
      "playwright": "^1.40.0",
      "typedoc": "^0.25.0",
      "typescript": "^5.3.0",
      "vite": "^5.0.0",
      "vite-plugin-dts": "^3.6.0",
      "vitest": "^1.0.0",
      "tsx": "^4.6.0"
   },
   "engines": {
      "node": ">=16.0.0"
   }
}
```

### 5.2 Documentation System

#### API Documentation

````typescript
// Auto-generated API docs using TypeDoc
/**
 * Recipe Scrapers TypeScript Library
 *
 * A comprehensive library for extracting recipe data from cooking websites.
 * Supports 500+ recipe sites with type-safe APIs and plugin system.
 *
 * @example
 * ```typescript
 * import { scrapeMe } from '@recipe-scrapers/core';
 *
 * const recipe = await scrapeMe('https://allrecipes.com/recipe/123456');
 * console.log(recipe.title);
 * console.log(recipe.ingredients);
 * ```
 *
 * @packageDocumentation
 */

/**
 * Main entry point for scraping recipes from URLs
 *
 * @param url - The URL of the recipe page to scrape
 * @returns Promise resolving to structured recipe data
 *
 * @example
 * ```typescript
 * const recipe = await scrapeMe('https://example.com/recipe');
 * ```
 */
export async function scrapeMe(url: string): Promise<StructuredRecipe> {
   // Implementation
}

/**
 * Scrape recipe data from HTML content
 *
 * @param html - Raw HTML content of the recipe page
 * @param url - Original URL of the page
 * @returns Structured recipe data
 *
 * @example
 * ```typescript
 * const html = '<html>...</html>';
 * const recipe = scrapeHtml(html, 'https://example.com');
 * ```
 */
export function scrapeHtml(html: string, url: string): StructuredRecipe {
   // Implementation
}
````

#### User Guides

````markdown
<!-- docs/guides/getting-started.md -->

# Getting Started

## Installation

```bash
npm install @recipe-scrapers/core
```
````

## Basic Usage

### Scraping from URL

```typescript
import { scrapeMe } from "@recipe-scrapers/core";

const recipe = await scrapeMe(
   "https://allrecipes.com/recipe/231506/simple-macaroni-and-cheese/"
);

console.log(recipe.title); // "Simple Macaroni and Cheese"
console.log(recipe.ingredients); // ["2 cups uncooked macaroni", ...]
console.log(recipe.instructions); // ["Bring a large pot of water to a boil...", ...]
```

### Scraping from HTML

```typescript
import { scrapeHtml } from "@recipe-scrapers/core";

const html = "<html>...</html>";
const recipe = scrapeHtml(html, "https://example.com/recipe");
```

### Browser Usage

```html
<script src="https://unpkg.com/@recipe-scrapers/core/dist/browser.umd.js"></script>
<script>
   const recipe = RecipeScrapers.scrapeFromDOM();
   console.log(recipe);
</script>
```

## Advanced Features

### Plugin System

```typescript
import { PluginManager, HtmlTagStripperPlugin } from "@recipe-scrapers/core";

const pluginManager = new PluginManager();
pluginManager.register(new HtmlTagStripperPlugin());
```

### Type Safety

```typescript
import type { StructuredRecipe, ParsedIngredient } from "@recipe-scrapers/core";

function processRecipe(recipe: StructuredRecipe): void {
   recipe.ingredients.forEach((group) => {
      group.ingredients.forEach((ingredient: ParsedIngredient) => {
         console.log(
            `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
         );
      });
   });
}
```

````

### 5.3 Testing Infrastructure

#### Comprehensive Test Suite

```typescript
// tests/integration/scrapers.test.ts
import { describe, it, expect } from 'vitest';
import { scrapeHtml } from '@/index';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Scraper Integration Tests', () => {
  const testSites = [
    'allrecipes',
    'foodnetwork',
    'bbcgoodfood',
    // ... more sites
  ];

  testSites.forEach(site => {
    describe(site, () => {
      it('should extract recipe data correctly', () => {
        const html = readFileSync(
          resolve(__dirname, `../data/${site}.html`),
          'utf8'
        );
        const expected = JSON.parse(
          readFileSync(
            resolve(__dirname, `../data/${site}.json`),
            'utf8'
          )
        );

        const recipe = scrapeHtml(html, `https://${site}.com/recipe/test`);

        expect(recipe.title).toBe(expected.title);
        expect(recipe.ingredients).toEqual(expected.ingredients);
        expect(recipe.instructions).toEqual(expected.instructions);
      });

      it('should have consistent performance', () => {
        const html = readFileSync(
          resolve(__dirname, `../data/${site}.html`),
          'utf8'
        );

        const start = performance.now();
        scrapeHtml(html, `https://${site}.com/recipe/test`);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100); // 100ms threshold
      });
    });
  });
});
````

#### E2E Testing

```typescript
// tests/e2e/live-sites.test.ts
import { test, expect } from "@playwright/test";
import { scrapeMe } from "@/index";

test.describe("Live Site Testing", () => {
   const testUrls = [
      "https://allrecipes.com/recipe/231506/simple-macaroni-and-cheese/",
      "https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524",
      // ... more URLs
   ];

   testUrls.forEach((url) => {
      test(`should scrape ${url}`, async ({ page }) => {
         // Navigate to ensure site is accessible
         await page.goto(url);
         await expect(page).toHaveTitle(/.*recipe.*/i);

         // Test the scraper
         const recipe = await scrapeMe(url);

         expect(recipe.title).toBeTruthy();
         expect(recipe.ingredients.length).toBeGreaterThan(0);
         expect(recipe.instructions.length).toBeGreaterThan(0);
      });
   });
});
```

### 5.4 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
   push:
      branches: [main, develop]
   pull_request:
      branches: [main]

jobs:
   test:
      runs-on: ubuntu-latest
      strategy:
         matrix:
            node-version: [16, 18, 20]

      steps:
         - uses: actions/checkout@v4

         - name: Use Node.js ${{ matrix.node-version }}
           uses: actions/setup-node@v4
           with:
              node-version: ${{ matrix.node-version }}
              cache: "npm"

         - name: Install dependencies
           run: npm ci

         - name: Type check
           run: npm run typecheck

         - name: Lint
           run: npm run lint

         - name: Unit tests
           run: npm run test:coverage

         - name: E2E tests
           run: npm run test:e2e

         - name: Build
           run: npm run build

         - name: Benchmark
           run: npm run benchmark

         - name: Upload coverage
           uses: codecov/codecov-action@v3

   publish:
      needs: test
      runs-on: ubuntu-latest
      if: github.ref == 'refs/heads/main'

      steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
              node-version: 20
              registry-url: "https://registry.npmjs.org"

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Publish to NPM
           run: npm publish --access public
           env:
              NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

         - name: Create GitHub Release
           uses: actions/create-release@v1
           env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5.5 Performance Monitoring

#### Benchmark Suite

```typescript
// benchmarks/scraper-performance.ts
import { scrapeHtml } from "@/index";
import { readFileSync } from "fs";
import { performance } from "perf_hooks";

interface BenchmarkResult {
   scraper: string;
   avgTime: number;
   minTime: number;
   maxTime: number;
   memoryUsage: number;
   throughput: number; // recipes per second
}

class PerformanceBenchmark {
   async runBenchmarks(): Promise<BenchmarkResult[]> {
      const scrapers = this.getScraperList();
      const results: BenchmarkResult[] = [];

      for (const scraper of scrapers) {
         const result = await this.benchmarkScraper(scraper);
         results.push(result);
      }

      return results;
   }

   private async benchmarkScraper(
      scraperName: string
   ): Promise<BenchmarkResult> {
      const html = readFileSync(`tests/data/${scraperName}.html`, "utf8");
      const iterations = 100;
      const times: number[] = [];

      // Warm up
      for (let i = 0; i < 10; i++) {
         scrapeHtml(html, `https://${scraperName}.com/recipe/test`);
      }

      // Measure performance
      for (let i = 0; i < iterations; i++) {
         const start = performance.now();
         scrapeHtml(html, `https://${scraperName}.com/recipe/test`);
         const end = performance.now();
         times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      return {
         scraper: scraperName,
         avgTime,
         minTime,
         maxTime,
         memoryUsage: process.memoryUsage().heapUsed,
         throughput: 1000 / avgTime,
      };
   }
}
```

## Tasks

### Week 1: Package & Build System

-  [ ] Finalize package structure
-  [ ] Configure build system (Vite/Rollup)
-  [ ] Set up dual package (ESM/CommonJS)
-  [ ] Create browser bundle
-  [ ] Configure TypeScript declarations

### Week 2: Documentation & Testing

-  [ ] Generate API documentation (TypeDoc)
-  [ ] Write user guides and examples
-  [ ] Complete test suite coverage
-  [ ] Set up E2E testing
-  [ ] Performance benchmarking

### Week 3: CI/CD & Quality

-  [ ] GitHub Actions workflows
-  [ ] Automated testing pipeline
-  [ ] Code coverage reporting
-  [ ] Performance monitoring
-  [ ] NPM publishing setup

### Week 4: Final Polish

-  [ ] Final testing and validation
-  [ ] Documentation review
-  [ ] Performance optimization
-  [ ] Security audit
-  [ ] Release preparation

## Success Criteria

-  ✅ Complete package with dual module support
-  ✅ Comprehensive documentation
-  ✅ >95% test coverage
-  ✅ Automated CI/CD pipeline
-  ✅ Performance benchmarks established
-  ✅ NPM package published
-  ✅ Migration guide complete

## Deliverables

-  **NPM Package**: Published to npm registry
-  **Documentation Site**: Complete API and user documentation
-  **GitHub Repository**: Full source code with CI/CD
-  **Migration Guide**: For users transitioning from Python
-  **Performance Reports**: Benchmark comparisons
-  **Release Notes**: Detailed changelog and features

## Post-Launch

-  Community support and issue resolution
-  Regular maintenance and updates
-  Performance monitoring and optimization
-  New scraper additions
-  Plugin ecosystem development
