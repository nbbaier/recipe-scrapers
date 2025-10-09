import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scrapeHtml } from '../../src/index.js';

export interface TestCase {
  domain: string;
  htmlFile: string;
  expectedJsonFile: string;
  url: string;
}

export interface ValidationResult {
  domain: string;
  success: boolean;
  pythonOutput: Record<string, any>;
  typescriptOutput: Record<string, any>;
  differences: string[];
  score: number;
  error?: string;
}

export class TestRunner {
  constructor(private rootDir: string = '.') {}

  /**
   * Run validation test for a specific domain
   */
  async runValidationTest(testCase: TestCase): Promise<ValidationResult> {
    try {
      // Load test HTML
      const htmlPath = join(this.rootDir, testCase.htmlFile);
      const html = readFileSync(htmlPath, 'utf-8');

      // Load expected Python output
      const expectedPath = join(this.rootDir, testCase.expectedJsonFile);
      const expectedOutput = JSON.parse(readFileSync(expectedPath, 'utf-8'));

      // Run TypeScript scraper
      const typescriptOutput = await this.runTypescriptScraper(html, testCase.url);

      // Run Python scraper for comparison (optional - use expected if not available)
      let pythonOutput = expectedOutput;
      try {
        pythonOutput = await this.runPythonScraper(html, testCase.url);
      } catch (error) {
        console.warn(`Using expected output for ${testCase.domain}, Python scraper failed:`, error);
      }

      // Compare outputs
      const comparison = this.compareOutputs(pythonOutput, typescriptOutput);

      return {
        domain: testCase.domain,
        success: comparison.score > 0.95, // 95% similarity threshold
        pythonOutput,
        typescriptOutput,
        differences: comparison.differences,
        score: comparison.score
      };

    } catch (error) {
      return {
        domain: testCase.domain,
        success: false,
        pythonOutput: {},
        typescriptOutput: {},
        differences: [`Error: ${error.message}`],
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Run TypeScript scraper on HTML content
   */
  private async runTypescriptScraper(html: string, url: string): Promise<Record<string, any>> {
    try {
      const scraper = scrapeHtml(html, url);
      return scraper.toJson();
    } catch (error) {
      throw new Error(`TypeScript scraper failed: ${error.message}`);
    }
  }

  /**
   * Run Python scraper on HTML content
   */
  private async runPythonScraper(html: string, url: string): Promise<Record<string, any>> {
    try {
      // Create temporary HTML file
      const tempHtmlFile = `/tmp/test-${Date.now()}.html`;
      writeFileSync(tempHtmlFile, html);

      // Run Python scraper
      const pythonScript = `
import json
import sys
sys.path.append('.')
from recipe_scrapers import scrape_html

try:
    with open('${tempHtmlFile}', 'r') as f:
        html = f.read()
    
    scraper = scrape_html(html, '${url}')
    result = scraper.to_json()
    print(json.dumps(result, ensure_ascii=False, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
`;

      const result = execSync(`python3 -c "${pythonScript}"`, { 
        encoding: 'utf-8',
        timeout: 30000 // 30 second timeout
      });

      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Python scraper failed: ${error.message}`);
    }
  }

  /**
   * Compare Python and TypeScript outputs
   */
  private compareOutputs(python: Record<string, any>, typescript: Record<string, any>): {
    differences: string[];
    score: number;
  } {
    const differences: string[] = [];
    let totalFields = 0;
    let matchingFields = 0;

    // Get all unique fields from both outputs
    const allFields = new Set([...Object.keys(python), ...Object.keys(typescript)]);

    for (const field of allFields) {
      totalFields++;

      const pythonValue = python[field];
      const typescriptValue = typescript[field];

      if (pythonValue === undefined && typescriptValue === undefined) {
        matchingFields++;
        continue;
      }

      if (pythonValue === undefined) {
        differences.push(`Missing in Python: ${field}`);
        continue;
      }

      if (typescriptValue === undefined) {
        differences.push(`Missing in TypeScript: ${field}`);
        continue;
      }

      // Deep comparison for arrays and objects
      if (this.deepEqual(pythonValue, typescriptValue)) {
        matchingFields++;
      } else {
        differences.push(`Mismatch in ${field}: Python=${JSON.stringify(pythonValue)} vs TypeScript=${JSON.stringify(typescriptValue)}`);
      }
    }

    const score = totalFields > 0 ? matchingFields / totalFields : 1;
    return { differences, score };
  }

  /**
   * Deep equality comparison with fuzzy string matching
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    // String comparison with normalization
    if (typeof a === 'string' && typeof b === 'string') {
      return this.normalizeString(a) === this.normalizeString(b);
    }

    // Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    // Object comparison
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => 
        keysB.includes(key) && this.deepEqual(a[key], b[key])
      );
    }

    return false;
  }

  /**
   * Normalize strings for comparison (trim, lowercase, remove extra spaces)
   */
  private normalizeString(str: string): string {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}