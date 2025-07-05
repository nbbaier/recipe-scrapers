# Revised Testing Strategy: Dynamic Test Generation

**Status**: ✅ Completed
**Priority**: High
**Impact**: Eliminates need for individual test files per scraper

## Current Problem

The initial TypeScript migration approach generates individual test files for each scraper:

-  50+ duplicate test files with similar structure
-  Hard to maintain and update test logic
-  Inconsistent test coverage across scrapers
-  Template generator complexity for test file creation

## Python's Superior Approach

The Python test suite uses a brilliant dynamic test generation strategy in [`tests/__init__.py`](../tests/__init__.py):

### Key Components

1. **Generic Test Factory** (`test_func_factory`):

   -  Single function that creates test methods for any scraper
   -  Takes HTML file, expected JSON, and host as parameters
   -  Returns a test function that validates scraper output

2. **Dynamic Test Discovery** (`prepare_test_cases`):

   -  Scans `tests/test_data/` directory structure
   -  Finds all `*.test.html` and `*.json` pairs
   -  Automatically generates test methods on `RecipeTestCase` class

3. **Data-Driven Testing**:

   -  Each scraper needs only HTML + expected JSON files
   -  No individual Python test files required
   -  Comprehensive validation of all scraper methods

4. **Standardized Test Coverage**:
   -  Mandatory tests: `title`, `ingredients`, `instructions_list`, etc.
   -  Optional tests: `category`, `description`, `cook_time`, etc.
   -  Consistent validation across all scrapers

## Proposed TypeScript Implementation

### 1. Core Test Framework

Create `tests/scrapers.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AbstractScraper } from "@/core/AbstractScraper";
import { SCRAPERS } from "@/index";

interface ExpectedData {
   title?: string;
   ingredients?: string[];
   instructions_list?: string[];
   total_time?: number;
   yields?: string;
   image?: string;
   author?: string;
   // ... other expected fields
}

const MANDATORY_TESTS = [
   "title",
   "ingredients",
   "instructions",
   "host",
] as const;

const OPTIONAL_TESTS = [
   "totalTime",
   "cookTime",
   "prepTime",
   "yields",
   "image",
   "author",
   "description",
   "category",
   "cuisine",
] as const;
```

### 2. Test Factory Function

```typescript
function createScraperTest(
   hostName: string,
   htmlPath: string,
   expectedPath: string
) {
   return () => {
      let scraper: AbstractScraper;
      let expected: ExpectedData;
      let html: string;

      beforeEach(() => {
         html = readFileSync(htmlPath, "utf8");
         expected = JSON.parse(readFileSync(expectedPath, "utf8"));

         // Get scraper class from registry
         const ScraperClass = SCRAPERS[hostName];
         if (!ScraperClass) {
            throw new Error(`No scraper found for host: ${hostName}`);
         }

         scraper = new ScraperClass(html, `https://${hostName}/recipe/test`);
      });

      // Test mandatory methods
      MANDATORY_TESTS.forEach((method) => {
         it(`should extract ${method}`, () => {
            if (method in expected) {
               const actual = scraper[method]();
               expect(actual).toEqual(expected[method]);
            } else {
               // Method should throw if no expected value
               expect(() => scraper[method]()).toThrow();
            }
         });
      });

      // Test optional methods
      OPTIONAL_TESTS.forEach((method) => {
         if (method in expected) {
            it(`should extract ${method}`, () => {
               const actual = scraper[method]();
               expect(actual).toEqual(expected[method]);
            });
         }
      });

      // Test host method
      it("should have correct host", () => {
         expect(scraper.constructor.host()).toBe(hostName);
      });

      // Test JSON conversion
      it("should convert to JSON correctly", () => {
         const json = scraper.toJSON();
         expect(json).toBeDefined();
         expect(json.title).toBeDefined();
         expect(Array.isArray(json.ingredients)).toBe(true);
         expect(Array.isArray(json.instructions)).toBe(true);
      });
   };
}
```

### 3. Dynamic Test Discovery

```typescript
function generateScraperTests() {
   const testDataDir = join(process.cwd(), "tests/test_data");

   if (!statSync(testDataDir).isDirectory()) {
      return;
   }

   const hostDirs = readdirSync(testDataDir).filter((item) =>
      statSync(join(testDataDir, item)).isDirectory()
   );

   hostDirs.forEach((hostName) => {
      const hostDir = join(testDataDir, hostName);
      const testFiles = readdirSync(hostDir).filter((file) =>
         file.endsWith(".test.html")
      );

      testFiles.forEach((htmlFile) => {
         const baseName = htmlFile.replace(".test.html", "");
         const jsonFile = `${baseName}.json`;

         const htmlPath = join(hostDir, htmlFile);
         const jsonPath = join(hostDir, jsonFile);

         // Check if corresponding JSON file exists
         try {
            statSync(jsonPath);

            // Create test suite for this scraper
            describe(
               `${hostName} - ${baseName}`,
               createScraperTest(hostName, htmlPath, jsonPath)
            );
         } catch (error) {
            console.warn(`Missing JSON file for ${htmlPath}`);
         }
      });
   });
}

// Generate all tests
generateScraperTests();
```

### 4. Scraper Registry

Update `src/index.ts` to export scraper registry:

```typescript
import { AllRecipes } from "./scrapers/AllRecipes";
import { BBCGoodFood } from "./scrapers/BBCGoodFood";
// ... import all scrapers

export const SCRAPERS: Record<string, typeof AbstractScraper> = {
   "allrecipes.com": AllRecipes,
   "bbcgoodfood.com": BBCGoodFood,
   // ... all scrapers
};

export { AbstractScraper };
// ... other exports
```

## Benefits of This Approach

### 1. **Maintainability**

-  Single test file vs 50+ individual files
-  Update test logic in one place
-  Consistent test coverage across all scrapers

### 2. **Scalability**

-  Adding new scrapers requires no new test files
-  Just add HTML + JSON test data
-  Automatic test discovery and generation

### 3. **Consistency**

-  All scrapers tested with same comprehensive logic
-  Standardized mandatory vs optional field testing
-  Uniform error handling and validation

### 4. **Simplicity**

-  No template generation needed for tests
-  Migration tooling focuses on scraper code only
-  Clear separation of concerns

## Implementation Steps

### Phase 1: Core Framework

1. ✅ Create `tests/scrapers.test.ts` with test factory
2. ✅ Implement dynamic test discovery
3. ✅ Add scraper registry to `src/index.ts`
4. ✅ Test with existing scrapers

### Phase 2: Migration Integration

1. ✅ Remove test file generation from migration tooling
2. ✅ Update migration workflow to focus on scraper code only
3. ✅ Delete existing individual test files

### Phase 3: Enhanced Testing

1. ✅ Add performance benchmarking to test suite
2. ✅ Implement cross-validation with Python scrapers
3. ✅ Add test data validation and linting

## Technical Considerations

### Vitest Integration

-  Use `describe.each()` for parameterized tests
-  Leverage Vitest's concurrent testing capabilities
-  Implement proper test isolation and cleanup

### Error Handling

-  Graceful handling of missing test data
-  Clear error messages for debugging
-  Skip tests for scrapers without data vs hard failures

### Performance

-  Lazy loading of test data
-  Parallel test execution where possible
-  Efficient file system operations

## Success Criteria

-  ✅ Single test file replaces 50+ individual files
-  ✅ All existing scrapers tested with comprehensive coverage
-  ✅ New scrapers automatically tested when test data added
-  ✅ Test execution time < 10 seconds for full suite
-  ✅ Clear test failure messages for debugging

## Impact on Migration Timeline

**Time Saved:**

-  No test file generation in migration tooling (~2-3 hours)
-  No maintenance of 50+ test files (~5-10 hours over project)
-  Faster debugging and iteration (~3-5 hours)

**Total Estimated Savings:** 10-18 hours over project lifecycle

This approach aligns the TypeScript migration with proven Python patterns while leveraging modern JavaScript testing capabilities.
