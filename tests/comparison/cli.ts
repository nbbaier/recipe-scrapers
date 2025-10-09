#!/usr/bin/env node

import { program } from 'commander';
import { TestRunner, ValidationResult } from './test-runner.js';
import { TestDataDiscovery } from './test-data.js';
import { ComparisonReporter } from './reporter.js';

async function main() {
  program
    .name('validation-tests')
    .description('Run TypeScript vs Python validation tests for recipe scrapers')
    .version('1.0.0');

  program
    .command('run')
    .description('Run validation tests')
    .option('-d, --domain <domain>', 'Test specific domain only')
    .option('-s, --scrapers <scrapers>', 'Test specific scrapers (comma-separated)')
    .option('--implemented-only', 'Only test scrapers that have TypeScript implementations')
    .option('--report <type>', 'Report type: summary|detailed|json', 'summary')
    .option('--output <file>', 'Output file for results')
    .action(async (options) => {
      try {
        await runValidationTests(options);
      } catch (error) {
        console.error('Error running validation tests:', error.message);
        process.exit(1);
      }
    });

  program
    .command('discover')
    .description('Discover available test data')
    .action(async () => {
      const discovery = new TestDataDiscovery();
      const summary = discovery.getTestDataSummary();
      
      console.log('Test Data Summary:');
      console.log(`  Total domains: ${summary.totalDomains}`);
      console.log(`  Total test cases: ${summary.totalTestCases}`);
      console.log(`  Implemented scrapers: ${summary.implementedScrapers}`);
      console.log(`  Available for testing: ${summary.availableForTesting}`);
    });

  program.parse();
}

async function runValidationTests(options: any) {
  const discovery = new TestDataDiscovery();
  const runner = new TestRunner();
  const reporter = new ComparisonReporter();

  // Discover test cases based on options
  let testCases;
  
  if (options.implementedOnly) {
    testCases = discovery.getTestCasesForImplementedScrapers();
  } else if (options.domain) {
    testCases = discovery.getTestCasesForDomains([options.domain]);
  } else if (options.scrapers) {
    const scrapers = options.scrapers.split(',').map(s => s.trim());
    testCases = discovery.getTestCasesForDomains(scrapers);
  } else {
    testCases = discovery.discoverTestCases();
  }

  if (testCases.length === 0) {
    console.log('No test cases found matching criteria');
    return;
  }

  console.log(`Running validation tests for ${testCases.length} test cases...`);

  const results: ValidationResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`Testing ${testCase.domain}... `);
    
    const result = await runner.runValidationTest(testCase);
    results.push(result);

    if (result.success) {
      console.log(`✓ PASS (${(result.score * 100).toFixed(1)}%)`);
      passed++;
    } else {
      console.log(`✗ FAIL (${(result.score * 100).toFixed(1)}%)`);
      failed++;
    }
  }

  // Generate report
  const report = reporter.generateReport(results, options.report);
  
  if (options.output) {
    const fs = await import('fs/promises');
    await fs.writeFile(options.output, report);
    console.log(`Report written to ${options.output}`);
  } else {
    console.log('\n' + report);
  }

  // Summary
  console.log(`\nValidation Summary:`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}