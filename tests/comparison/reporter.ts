import { ValidationResult } from './test-runner.js';

export interface ReportSummary {
  totalTests: number;
  passed: number;
  failed: number;
  successRate: number;
  averageScore: number;
}

export class ComparisonReporter {
  /**
   * Generate a comprehensive report of validation results
   */
  generateReport(results: ValidationResult[], format: 'summary' | 'detailed' | 'json' = 'summary'): string {
    switch (format) {
      case 'json':
        return this.generateJsonReport(results);
      case 'detailed':
        return this.generateDetailedReport(results);
      default:
        return this.generateSummaryReport(results);
    }
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(results: ValidationResult[]): string {
    const summary = this.calculateSummary(results);
    const failedTests = results.filter(r => !r.success);

    let report = `
=== TypeScript vs Python Validation Report ===

Summary:
  Total Tests: ${summary.totalTests}
  Passed: ${summary.passed}
  Failed: ${summary.failed}
  Success Rate: ${summary.successRate.toFixed(1)}%
  Average Score: ${summary.averageScore.toFixed(1)}%

`;

    if (failedTests.length > 0) {
      report += `Failed Tests:\n`;
      for (const test of failedTests) {
        report += `  ✗ ${test.domain} (${(test.score * 100).toFixed(1)}%)\n`;
        if (test.error) {
          report += `    Error: ${test.error}\n`;
        }
        if (test.differences.length > 0) {
          report += `    Issues: ${test.differences.length} differences found\n`;
        }
      }
    }

    return report;
  }

  /**
   * Generate detailed report with diff information
   */
  private generateDetailedReport(results: ValidationResult[]): string {
    const summary = this.calculateSummary(results);
    
    let report = `
=== Detailed TypeScript vs Python Validation Report ===

Summary:
  Total Tests: ${summary.totalTests}
  Passed: ${summary.passed}
  Failed: ${summary.failed}
  Success Rate: ${summary.successRate.toFixed(1)}%
  Average Score: ${summary.averageScore.toFixed(1)}%

=== Test Results ===

`;

    for (const result of results) {
      const status = result.success ? '✓ PASS' : '✗ FAIL';
      report += `${status} ${result.domain} (${(result.score * 100).toFixed(1)}%)\n`;

      if (result.error) {
        report += `  Error: ${result.error}\n`;
      }

      if (result.differences.length > 0) {
        report += `  Differences (${result.differences.length}):\n`;
        for (const diff of result.differences.slice(0, 10)) { // Limit to first 10
          report += `    - ${diff}\n`;
        }
        if (result.differences.length > 10) {
          report += `    ... and ${result.differences.length - 10} more\n`;
        }
      }

      // Show field comparison
      const pythonFields = Object.keys(result.pythonOutput || {});
      const typescriptFields = Object.keys(result.typescriptOutput || {});
      const allFields = new Set([...pythonFields, ...typescriptFields]);

      if (allFields.size > 0) {
        report += `  Field Coverage:\n`;
        report += `    Python: ${pythonFields.length} fields\n`;
        report += `    TypeScript: ${typescriptFields.length} fields\n`;
        
        const missingInTs = pythonFields.filter(f => !typescriptFields.includes(f));
        const missingInPy = typescriptFields.filter(f => !pythonFields.includes(f));
        
        if (missingInTs.length > 0) {
          report += `    Missing in TypeScript: ${missingInTs.join(', ')}\n`;
        }
        if (missingInPy.length > 0) {
          report += `    Missing in Python: ${missingInPy.join(', ')}\n`;
        }
      }

      report += `\n`;
    }

    return report;
  }

  /**
   * Generate JSON report for programmatic consumption
   */
  private generateJsonReport(results: ValidationResult[]): string {
    const summary = this.calculateSummary(results);
    
    const report = {
      summary,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        domain: r.domain,
        success: r.success,
        score: r.score,
        error: r.error,
        differenceCount: r.differences.length,
        differences: r.differences,
        fieldComparison: this.analyzeFieldCoverage(r)
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: ValidationResult[]): ReportSummary {
    const totalTests = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = totalTests - passed;
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const averageScore = totalTests > 0 
      ? (results.reduce((sum, r) => sum + r.score, 0) / totalTests) * 100 
      : 0;

    return {
      totalTests,
      passed,
      failed,
      successRate,
      averageScore
    };
  }

  /**
   * Analyze field coverage between Python and TypeScript outputs
   */
  private analyzeFieldCoverage(result: ValidationResult): {
    pythonFields: string[];
    typescriptFields: string[];
    commonFields: string[];
    missingInTypeScript: string[];
    missingInPython: string[];
  } {
    const pythonFields = Object.keys(result.pythonOutput || {});
    const typescriptFields = Object.keys(result.typescriptOutput || {});
    
    const commonFields = pythonFields.filter(f => typescriptFields.includes(f));
    const missingInTypeScript = pythonFields.filter(f => !typescriptFields.includes(f));
    const missingInPython = typescriptFields.filter(f => !pythonFields.includes(f));

    return {
      pythonFields,
      typescriptFields,
      commonFields,
      missingInTypeScript,
      missingInPython
    };
  }

  /**
   * Generate HTML report for web viewing
   */
  generateHtmlReport(results: ValidationResult[]): string {
    const summary = this.calculateSummary(results);
    
    return `

<html>
<head>
    <title>TypeScript vs Python Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { border-left: 5px solid #28a745; }
        .fail { border-left: 5px solid #dc3545; }
        .differences { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .field-analysis { background: #e7f3ff; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .score { font-weight: bold; }
        .error { color: #dc3545; font-style: italic; }
    </style>
</head>
<body>
    <h1>TypeScript vs Python Validation Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${summary.totalTests}</p>
        <p>Passed: ${summary.passed}</p>
        <p>Failed: ${summary.failed}</p>
        <p>Success Rate: ${summary.successRate.toFixed(1)}%</p>
        <p>Average Score: ${summary.averageScore.toFixed(1)}%</p>
    </div>

    <h2>Test Results</h2>
    ${results.map(result => this.generateHtmlTestResult(result)).join('')}
</body>
</html>`;
  }

  private generateHtmlTestResult(result: ValidationResult): string {
    const status = result.success ? 'pass' : 'fail';
    const statusText = result.success ? 'PASS' : 'FAIL';
    const coverage = this.analyzeFieldCoverage(result);

    return `
    <div class="test-result ${status}">
        <h3>${result.domain} - ${statusText} <span class="score">(${(result.score * 100).toFixed(1)}%)</span></h3>
        
        ${result.error ? `<p class="error">Error: ${result.error}</p>` : ''}
        
        ${result.differences.length > 0 ? `
        <div class="differences">
            <h4>Differences (${result.differences.length})</h4>
            <ul>
                ${result.differences.slice(0, 10).map(diff => `<li>${diff}</li>`).join('')}
                ${result.differences.length > 10 ? `<li>... and ${result.differences.length - 10} more</li>` : ''}
            </ul>
        </div>` : ''}
        
        <div class="field-analysis">
            <h4>Field Analysis</h4>
            <p>Python fields: ${coverage.pythonFields.length}</p>
            <p>TypeScript fields: ${coverage.typescriptFields.length}</p>
            <p>Common fields: ${coverage.commonFields.length}</p>
            ${coverage.missingInTypeScript.length > 0 ? `<p>Missing in TypeScript: ${coverage.missingInTypeScript.join(', ')}</p>` : ''}
            ${coverage.missingInPython.length > 0 ? `<p>Missing in Python: ${coverage.missingInPython.join(', ')}</p>` : ''}
        </div>
    </div>`;
  }
}