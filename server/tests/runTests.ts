/**
 * Test Runner CLI
 * 
 * This script runs the test suite from the command line.
 * It parses arguments and executes the appropriate tests.
 * 
 * Usage:
 *   npx tsx server/tests/runTests.ts [options]
 * 
 * Options:
 *   --category=<category>  Run tests for a specific category (dji, api, database, ui, integration)
 *   --verbose              Enable verbose output
 *   --stop-on-failure      Stop testing on first failure
 *   --save-report          Save test report to a file
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { TestRunner, TestCategory, createAllTests } from './testRunner';

// Parse command line arguments
const args = process.argv.slice(2);
const options: {
  category?: TestCategory;
  verbose: boolean;
  stopOnFailure: boolean;
  saveReport: boolean;
  reportDir: string;
} = {
  verbose: false,
  stopOnFailure: false,
  saveReport: false,
  reportDir: './test-reports',
};

// Process args
for (const arg of args) {
  if (arg.startsWith('--category=')) {
    const category = arg.split('=')[1] as TestCategory;
    if (Object.values(TestCategory).includes(category)) {
      options.category = category;
    } else {
      console.error(chalk.red(`Invalid category: ${category}`));
      process.exit(1);
    }
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--stop-on-failure') {
    options.stopOnFailure = true;
  } else if (arg === '--save-report') {
    options.saveReport = true;
  } else if (arg.startsWith('--report-dir=')) {
    options.reportDir = arg.split('=')[1];
  }
}

async function main() {
  console.log(chalk.blue('======================================'));
  console.log(chalk.blue('       DJI Drone App Test Runner      '));
  console.log(chalk.blue('======================================'));
  
  // Config for tests
  const config = {
    baseUrl: 'http://localhost:5000',
    category: options.category,
    verbose: options.verbose,
    stopOnFailure: options.stopOnFailure,
  };
  
  // Create and configure test runner
  const runner = new TestRunner(config);
  
  // Add all test cases
  const tests = createAllTests(config.baseUrl);
  runner.addTests(tests);
  
  console.log(chalk.yellow(`Running ${options.category || 'all'} tests...`));
  
  const startTime = Date.now();
  const report = await runner.runTests();
  const duration = Date.now() - startTime;
  
  console.log(chalk.blue('\n======================================'));
  console.log(`Tests completed in ${duration / 1000} seconds`);
  
  // Save report if requested
  if (options.saveReport) {
    try {
      await fs.mkdir(options.reportDir, { recursive: true });
      const reportPath = path.join(
        options.reportDir,
        `test-report-${new Date().toISOString().replace(/:/g, '-')}.json`
      );
      
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\nTest report saved to ${reportPath}`));
    } catch (error) {
      console.error(chalk.red('Error saving test report:'), error);
    }
  }
  
  // Exit with appropriate code
  if (report.summary.failed > 0) {
    console.log(chalk.red(`\n❌ Tests failed: ${report.summary.failed}/${report.summary.total}`));
    process.exit(1);
  } else {
    console.log(chalk.green(`\n✅ All tests passed: ${report.summary.passed}/${report.summary.total}`));
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(chalk.red('\nUnhandled error running tests:'));
  console.error(error);
  process.exit(2);
});