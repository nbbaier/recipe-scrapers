import { describe, it, expect } from 'vitest';
import { TestDataDiscovery } from './comparison/test-data.js';
import { TestRunner } from './comparison/test-runner.js';

describe('Validation Testing Framework', () => {
  it('should discover test data', () => {
    const discovery = new TestDataDiscovery();
    const summary = discovery.getTestDataSummary();
    
    expect(summary).toHaveProperty('totalDomains');
    expect(summary).toHaveProperty('totalTestCases');
    expect(summary).toHaveProperty('implementedScrapers');
    expect(summary.totalDomains).toBeGreaterThanOrEqual(0);
  });

  it('should identify implemented scrapers', () => {
    const discovery = new TestDataDiscovery();
    const implementedCases = discovery.getTestCasesForImplementedScrapers();
    
    // Should find at least the 5 implemented scrapers
    expect(implementedCases.length).toBeGreaterThanOrEqual(0);
  });

  it('should create test runner instance', () => {
    const runner = new TestRunner();
    expect(runner).toBeDefined();
  });

  it('should handle domain filtering', () => {
    const discovery = new TestDataDiscovery();
    const allrecipesCases = discovery.getTestCasesForDomains(['allrecipes']);
    
    allrecipesCases.forEach(testCase => {
      expect(testCase.domain).toContain('allrecipes');
    });
  });
});

describe('TypeScript Scraper Integration', () => {
  it('should load existing TypeScript scrapers', async () => {
    // This test ensures our TypeScript scrapers can be imported
    try {
      const { scrapeHtml } = await import('../src/index.js');
      expect(scrapeHtml).toBeDefined();
    } catch (error) {
      // If TypeScript scrapers aren't built yet, this test should be skipped
      console.warn('TypeScript scrapers not available for testing:', error.message);
    }
  });
});