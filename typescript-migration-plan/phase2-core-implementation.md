# Phase 2: Core Implementation

**Duration**: 6-8 weeks
**Status**: ⏳ Pending Phase 1

## Overview

Implement the core scraping functionality with the top 50 most-used recipe sites. This phase focuses on establishing proven patterns and validating the architecture.

## Deliverables

### 2.1 Priority Site Selection

Select the top 50 recipe scrapers based on:

-  **Usage metrics** from Python library
-  **Different parsing strategies** (Schema.org, custom selectors, mixed)
-  **Site complexity** (simple to complex)
-  **Geographic distribution** (US, EU, global sites)

#### Tier 1 Sites (First 10)

-  AllRecipes.com
-  Food Network
-  BBC Good Food
-  Serious Eats
-  Bon Appétit
-  Epicurious
-  Delish
-  Tasty
-  Martha Stewart
-  Simply Recipes

#### Tier 2 Sites (Next 20)

-  The Pioneer Woman
-  Minimalist Baker
-  Cookie and Kate
-  Half Baked Harvest
-  Gimme Some Oven
-  Pinch of Yum
-  Budget Bytes
-  Skinnytaste
-  Two Peas & Their Pod
-  Sally's Baking Addiction
-  The Recipe Critic
-  Damn Delicious
-  Cafe Delites
-  Dinner at the Zoo
-  Dinner Then Dessert
-  Natasha's Kitchen
-  Jessica in the Kitchen
-  Cooking Classy
-  The Mediterranean Dish
-  Love and Lemons

#### Tier 3 Sites (Next 20)

-  International and specialized sites
-  Complex parsing requirements
-  Edge cases and unique formats

### 2.2 Automated Migration Tools

#### Python to TypeScript Converter

```typescript
interface ScraperAnalysis {
   className: string;
   hostName: string;
   methods: MethodAnalysis[];
   imports: string[];
   complexity: "simple" | "medium" | "complex";
   parsingStrategy: "schema" | "selectors" | "mixed";
}

interface MethodAnalysis {
   name: string;
   returnType: string;
   selectors: string[];
   schemaProperties: string[];
   complexity: number;
}

class MigrationTool {
   analyzePythonScraper(filePath: string): ScraperAnalysis {
      const content = fs.readFileSync(filePath, "utf8");
      const ast = parsePythonAST(content);

      return {
         className: this.extractClassName(ast),
         hostName: this.extractHostName(ast),
         methods: this.analyzeMethods(ast),
         imports: this.extractImports(ast),
         complexity: this.assessComplexity(ast),
         parsingStrategy: this.detectStrategy(ast),
      };
   }

   generateTypeScriptScraper(analysis: ScraperAnalysis): string {
      const template = new ScraperTemplate(analysis);
      return template.generate();
   }

   private extractClassName(ast: any): string {
      // Extract class name from Python AST
      return ast.body.find((node) => node.type === "ClassDef")?.name || "";
   }

   private extractHostName(ast: any): string {
      // Extract host() method return value
      const hostMethod = this.findMethod(ast, "host");
      return hostMethod?.body?.value || "";
   }

   private analyzeMethods(ast: any): MethodAnalysis[] {
      return ast.body
         .filter((node) => node.type === "FunctionDef")
         .map((method) => this.analyzeMethod(method));
   }

   private analyzeMethod(method: any): MethodAnalysis {
      return {
         name: method.name,
         returnType: this.inferReturnType(method),
         selectors: this.extractSelectors(method),
         schemaProperties: this.extractSchemaProperties(method),
         complexity: this.calculateComplexity(method),
      };
   }
}
```

#### TypeScript Template Generator

```typescript
class ScraperTemplate {
   constructor(private analysis: ScraperAnalysis) {}

   generate(): string {
      return `
import { AbstractScraper } from '../core/AbstractScraper';

export class ${this.analysis.className} extends AbstractScraper {
  static host(): string {
    return '${this.analysis.hostName}';
  }
  
  ${this.generateMethods()}
}
    `.trim();
   }

   private generateMethods(): string {
      return this.analysis.methods
         .map((method) => this.generateMethod(method))
         .join("\n\n  ");
   }

   private generateMethod(method: MethodAnalysis): string {
      switch (method.name) {
         case "title":
            return this.generateTitleMethod(method);
         case "ingredients":
            return this.generateIngredientsMethod(method);
         case "instructions":
            return this.generateInstructionsMethod(method);
         default:
            return this.generateGenericMethod(method);
      }
   }

   private generateTitleMethod(method: MethodAnalysis): string {
      const selectors = method.selectors.map((s) => `'${s}'`).join(", ");
      return `
  protected titleFromSelector(): string {
    const element = this.$(${selectors}).first();
    if (!element.length) {
      throw new ElementNotFoundError('title');
    }
    return this.normalize(element.text());
  }`;
   }
}
```

### 2.3 Testing Framework

#### Unit Test Structure

```typescript
// tests/scrapers/AllRecipes.test.ts
describe("AllRecipes Scraper", () => {
   let scraper: AllRecipes;
   let html: string;

   beforeEach(() => {
      html = fs.readFileSync("tests/data/allrecipes.html", "utf8");
      scraper = new AllRecipes(html, "https://allrecipes.com/recipe/test");
   });

   it("should extract title correctly", () => {
      expect(scraper.title()).toBe("Expected Title");
   });

   it("should extract ingredients correctly", () => {
      const ingredients = scraper.ingredients();
      expect(ingredients).toHaveLength(8);
      expect(ingredients[0]).toBe("1 cup flour");
   });

   it("should extract instructions correctly", () => {
      const instructions = scraper.instructions();
      expect(instructions).toHaveLength(5);
      expect(instructions[0]).toContain("Preheat oven");
   });

   it("should match Python output", async () => {
      const pythonOutput = await runPythonScraper(html);
      const tsOutput = scraper.toJSON();

      expect(tsOutput.title).toBe(pythonOutput.title);
      expect(tsOutput.ingredients).toEqual(pythonOutput.ingredients);
      expect(tsOutput.instructions).toEqual(pythonOutput.instructions);
   });
});
```

#### Cross-Validation Testing

```typescript
class CrossValidationTest {
   async validateScraper(
      scraperClass: typeof AbstractScraper,
      testData: TestData
   ): Promise<ValidationResult> {
      const tsScraper = new scraperClass(testData.html, testData.url);
      const pythonOutput = await this.runPythonScraper(
         testData.pythonClass,
         testData.html
      );
      const tsOutput = tsScraper.toJSON();

      return {
         passed: this.compareOutputs(pythonOutput, tsOutput),
         differences: this.findDifferences(pythonOutput, tsOutput),
         performance: await this.measurePerformance(tsScraper, testData),
      };
   }

   private compareOutputs(python: any, typescript: any): boolean {
      const fields = [
         "title",
         "ingredients",
         "instructions",
         "totalTime",
         "yields",
      ];
      return fields.every((field) =>
         this.deepEqual(python[field], typescript[field])
      );
   }

   private async measurePerformance(
      scraper: AbstractScraper,
      testData: TestData
   ): Promise<PerformanceResult> {
      const startTime = performance.now();
      scraper.toJSON();
      const endTime = performance.now();

      return {
         parseDuration: endTime - startTime,
         memoryUsage: process.memoryUsage().heapUsed,
      };
   }
}
```

### 2.4 Quality Assurance Pipeline

#### Validation Workflow

```typescript
class ValidationPipeline {
   async validateBatch(
      scrapers: ScraperInfo[]
   ): Promise<BatchValidationResult> {
      const results = await Promise.all(
         scrapers.map((scraper) => this.validateScraper(scraper))
      );

      return {
         totalScrapers: scrapers.length,
         passed: results.filter((r) => r.passed).length,
         failed: results.filter((r) => !r.passed).length,
         averagePerformance: this.calculateAveragePerformance(results),
         failedScrapers: results.filter((r) => !r.passed).map((r) => r.scraper),
      };
   }

   private async validateScraper(
      scraper: ScraperInfo
   ): Promise<ScraperValidationResult> {
      try {
         const testData = await this.loadTestData(scraper);
         const validation = await this.crossValidationTest.validateScraper(
            scraper.class,
            testData
         );

         return {
            scraper: scraper.name,
            passed: validation.passed,
            performance: validation.performance,
            issues: validation.differences,
         };
      } catch (error) {
         return {
            scraper: scraper.name,
            passed: false,
            error: error.message,
         };
      }
   }
}
```

## Tasks

### Week 1-2: Migration Tooling

-  [ ] Implement Python AST parser
-  [ ] Create TypeScript template generator
-  [ ] Build migration workflow
-  [ ] Test with simple scrapers

### Week 3-4: Tier 1 Sites Implementation

-  [ ] Convert first 10 priority sites
-  [ ] Manual review and refinement
-  [ ] Cross-validation testing
-  [ ] Performance benchmarking

### Week 5-6: Tier 2 Sites Implementation

-  [ ] Convert next 20 sites
-  [ ] Automated testing pipeline
-  [ ] Issue tracking and resolution
-  [ ] Documentation updates

### Week 7-8: Tier 3 Sites & Optimization

-  [ ] Convert remaining 20 sites
-  [ ] Performance optimization
-  [ ] Edge case handling
-  [ ] Quality assurance review

## Success Criteria

-  ✅ 50 scrapers successfully converted
-  ✅ >95% cross-validation pass rate
-  ✅ <20% performance degradation vs Python
-  ✅ Automated testing pipeline operational
-  ✅ Migration tooling documented and tested
-  ✅ Quality assurance processes established

## Risks & Mitigation

| Risk                       | Impact | Mitigation                         |
| -------------------------- | ------ | ---------------------------------- |
| Complex selector migration | High   | Manual review for complex scrapers |
| Performance degradation    | Medium | Optimize parsing pipeline          |
| Test data inconsistency    | Medium | Refresh test HTML files            |
| Edge case handling         | Low    | Comprehensive error handling       |

## Next Phase

Once Phase 2 is complete, proceed to [Phase 3: Bulk Migration](./phase3-bulk-migration.md).
