import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { TestCase } from './test-runner.js';

export class TestDataDiscovery {
  constructor(private rootDir: string = '.') {}

  /**
   * Discover all available test cases by finding matching HTML/JSON pairs
   */
  discoverTestCases(): TestCase[] {
    const testCases: TestCase[] = [];
    
    // Look for test data in various possible locations
    const searchPaths = [
      'tests/test_data',
      'test_data', 
      'tests/data',
      'recipe_scrapers/tests/test_data'
    ];

    for (const searchPath of searchPaths) {
      const fullPath = join(this.rootDir, searchPath);
      if (existsSync(fullPath)) {
        const cases = this.scanDirectory(fullPath);
        testCases.push(...cases);
      }
    }

    return testCases;
  }

  /**
   * Get test cases for specific domains
   */
  getTestCasesForDomains(domains: string[]): TestCase[] {
    const allCases = this.discoverTestCases();
    return allCases.filter(testCase => 
      domains.some(domain => testCase.domain.includes(domain))
    );
  }

  /**
   * Get test cases that have corresponding TypeScript scrapers
   */
  getTestCasesForImplementedScrapers(): TestCase[] {
    const allCases = this.discoverTestCases();
    const implementedScrapers = this.getImplementedScrapers();
    
    return allCases.filter(testCase => {
      const scraperName = this.domainToScraperName(testCase.domain);
      return implementedScrapers.includes(scraperName);
    });
  }

  /**
   * Scan directory for test HTML/JSON pairs
   */
  private scanDirectory(dirPath: string): TestCase[] {
    const testCases: TestCase[] = [];

    try {
      const items = readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = join(dirPath, item);
        
        if (statSync(itemPath).isDirectory()) {
          // This might be a domain directory
          const domainCases = this.scanDomainDirectory(itemPath, item);
          testCases.push(...domainCases);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return testCases;
  }

  /**
   * Scan a domain-specific directory for test files
   */
  private scanDomainDirectory(dirPath: string, domain: string): TestCase[] {
    const testCases: TestCase[] = [];

    try {
      const files = readdirSync(dirPath);
      const htmlFiles = files.filter(f => f.endsWith('.testhtml'));
      
      for (const htmlFile of htmlFiles) {
        const baseName = htmlFile.replace('.testhtml', '');
        const jsonFile = `${baseName}.json`;
        
        if (files.includes(jsonFile)) {
          testCases.push({
            domain,
            htmlFile: join(dirPath, htmlFile),
            expectedJsonFile: join(dirPath, jsonFile),
            url: this.generateTestUrl(domain, baseName)
          });
        }
      }
    } catch (error) {
      // Directory can't be read
    }

    return testCases;
  }

  /**
   * Get list of implemented TypeScript scrapers
   */
  private getImplementedScrapers(): string[] {
    const scrapersDir = join(this.rootDir, 'src/scrapers');
    
    try {
      const files = readdirSync(scrapersDir);
      return files
        .filter(f => f.endsWith('.ts') && !f.includes('index') && !f.includes('registry'))
        .map(f => f.replace('.ts', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Convert domain name to scraper name
   */
  private domainToScraperName(domain: string): string {
    // Remove TLD and convert to camelCase
    return domain
      .replace(/\.(com|org|net|co\.uk|com\.au)$/, '')
      .replace(/\./g, '')
      .toLowerCase();
  }

  /**
   * Generate a test URL for a domain and test case
   */
  private generateTestUrl(domain: string, testName: string): string {
    return `https://www.${domain}/recipe/test-${testName}/`;
  }

  /**
   * Get summary of available test data
   */
  getTestDataSummary(): {
    totalDomains: number;
    totalTestCases: number;
    implementedScrapers: number;
    availableForTesting: number;
  } {
    const allCases = this.discoverTestCases();
    const implementedCases = this.getTestCasesForImplementedScrapers();
    const implementedScrapers = this.getImplementedScrapers();
    
    const uniqueDomains = new Set(allCases.map(c => c.domain));

    return {
      totalDomains: uniqueDomains.size,
      totalTestCases: allCases.length,
      implementedScrapers: implementedScrapers.length,
      availableForTesting: implementedCases.length
    };
  }
}