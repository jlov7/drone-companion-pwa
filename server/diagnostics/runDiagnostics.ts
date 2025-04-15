/**
 * DJI API Diagnostics Runner
 * 
 * This script runs the comprehensive API diagnostics tool.
 * It can be run directly from the command line.
 * 
 * Usage:
 *   npx tsx server/diagnostics/runDiagnostics.ts [options]
 * 
 * Options:
 *   --save        Save the diagnostic report to a file
 *   --help        Show help information
 */

import { runFullDiagnostics } from './apiTester';
import chalk from 'chalk';

// Parse command line arguments
const args = process.argv.slice(2);
const options: {
  save?: boolean;
  verbose?: boolean;
  ignoreFailures?: boolean;
  help?: boolean;
} = {
  verbose: true, // Default to verbose
  ignoreFailures: true // Default to ignore failures
};

// Parse arguments
for (const arg of args) {
  if (arg === '--save') {
    options.save = true;
  } else if (arg === '--quiet') {
    options.verbose = false;
  } else if (arg === '--strict') {
    options.ignoreFailures = false;
  } else if (arg === '--help') {
    options.help = true;
  }
}

// Show help if requested
if (options.help) {
  console.log(chalk.blue('\nDJI API Diagnostics Runner'));
  console.log('\nThis utility performs comprehensive diagnostics on the DJI API integration.\n');
  console.log('Usage:');
  console.log('  npx tsx server/diagnostics/runDiagnostics.ts [options]\n');
  console.log('Options:');
  console.log('  --save         Save the diagnostic report to a file');
  console.log('  --quiet        Run without verbose output');
  console.log('  --strict       Fail on any error (don\'t ignore failures)');
  console.log('  --help         Show this help information\n');
  console.log('Example:');
  console.log('  npx tsx server/diagnostics/runDiagnostics.ts --save --strict\n');
  process.exit(0);
}

// Run the diagnostics
async function main() {
  console.log(chalk.blue('\n======================================'));
  console.log(chalk.blue('🚁 DJI API Diagnostics Tool 🚁'));
  console.log(chalk.blue('======================================\n'));
  
  try {
    console.log(chalk.yellow('Running diagnostics...\n'));
    
    const startTime = Date.now();
    const report = await runFullDiagnostics(options);
    const duration = Date.now() - startTime;
    
    console.log(chalk.blue('\n======================================'));
    console.log(`Diagnostics completed in ${duration / 1000} seconds`);
    
    if (report.overallStatus === 'success') {
      console.log(chalk.green('\n✅ All systems operational!'));
      process.exit(0);
    } else if (report.overallStatus === 'partial') {
      console.log(chalk.yellow('\n⚠️ System partially operational.'));
      console.log(chalk.yellow('Some components are working, but others have issues.'));
      process.exit(1);
    } else {
      console.log(chalk.red('\n❌ System has critical failures.'));
      console.log(chalk.red('Review the diagnostics report for details.'));
      process.exit(2);
    }
  } catch (error) {
    console.error(chalk.red('\nDiagnostics failed with an unhandled error:'));
    console.error(error);
    process.exit(3);
  }
}

main();