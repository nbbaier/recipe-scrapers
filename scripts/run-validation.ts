#!/usr/bin/env node

/**
 * Validation Test Runner Script
 * 
 * This script runs validation tests comparing TypeScript scraper output
 * against Python scraper output using existing test data.
 */

import { TestRunner } from '../tests/comparison/test-runner.js';
import { TestDataDiscovery } from '../tests/comparison/test-data.js';
import { ComparisonReporter } from '../tests/comparison/reporter.js';

async function main() {
  const args = process.argv.slice(2);
  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const reportType = args.find(arg => arg.startsWith('--report='))?.split('=')[1] || 'summary';
  const implementedOnly = args.includes('--implemented-only');

  console.log('🧪 Starting TypeScript vs Python validation tests...\n');

  const discovery = new TestDataDiscovery();
  const runner = new TestRunner();
  const reporter = new ComparisonReporter();

  // Discover test cases
  let testCases;
  if (implementedOnly) {
    testCases = discovery.getTestCasesForImplementedScrapers();
    console.log('📋 Running tests for implemented scrapers only');
  } else if (domain) {
    testCases = discovery.getTestCasesForDomains([domain]);
    console.log(`📋 Running tests for domain: ${domain}`);
  } else {
    // For now, just test implemented scrapers to avoid overwhelming output
    testCases = discovery.getTestCasesForImplementedScrapers();
    console.log('📋 Running tests for all implemented scrapers');
  }

  if (testCases.length === 0) {
    console.log('❌ No test cases found. Make sure test data exists and TypeScript scrapers are implemented.');
    process.exit(1);
  }

  console.log(`📊 Found ${testCases.length} test cases\n`);

  // Run tests
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`Testing ${testCase.domain}... `);
    
    try {
      const result = await runner.runValidationTest(testCase);
      results.push(result);

      if (result.success) {
        console.log(`✅ PASS (${(result.score * 100).toFixed(1)}%)`);
        passed++;
      } else {
        console.log(`❌ FAIL (${(result.score * 100).toFixed(1)}%)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  // Generate and display report
  console.log('\n' + '='.repeat(60));
  const report = reporter.generateReport(results, reportType as any);
  console.log(report);

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});