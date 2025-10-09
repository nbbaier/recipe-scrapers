# TypeScript-Python Validation Framework

## Overview

This framework validates TypeScript recipe scrapers against their Python counterparts to ensure 1:1 functional parity during the porting process.

## Test Data Structure

- **HTML Files**: `*.testhtml` - Actual recipe HTML pages for testing
- **Expected JSON**: `*.json` - Expected output from Python scrapers 
- **Test Pairs**: Each domain has matching HTML and JSON files

## Framework Components

### 1. Test Runner (`test-runner.ts`)
- Executes both Python and TypeScript scrapers on same HTML
- Captures JSON outputs from both implementations
- Runs comparison utilities

### 2. Comparison Engine (`comparison.ts`)
- Field-by-field comparison of JSON outputs
- Identifies differences and similarity scores
- Supports fuzzy matching for minor text differences

### 3. Test Data Pipeline (`test-data.ts`)
- Discovers existing test HTML/JSON pairs
- Manages test data loading and validation
- Supports filtering by domain/pattern

### 4. Reporting System (`reporter.ts`)
- Generates detailed comparison reports
- Shows pass/fail status for each scraper
- Provides diff views for debugging

## Usage

```bash
# Run all validation tests
npm run test:validation

# Test specific domain
npm run test:validation -- --domain=allrecipes.com

# Test specific scrapers  
npm run test:validation -- --scrapers=allrecipes,bonappetit

# Generate detailed report
npm run test:validation -- --report=detailed
```

## Implementation Plan

1. Build test data discovery system
2. Create Python execution wrapper
3. Implement TypeScript test runner
4. Build comparison utilities
5. Create reporting system
6. Integrate with CI/CD pipeline