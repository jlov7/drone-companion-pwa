/**
 * DJI API Credential Monitor
 * 
 * This utility monitors and manages DJI API credentials and keys.
 * It helps identify missing or expired credentials and validates their correctness.
 */

import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Required DJI API Keys
const REQUIRED_KEYS = [
  'DJI_API_KEY',
  'DJI_API_SECRET',
  'DJI_OPEN_API_KEY',
  'DJI_OPEN_API_SECRET',
  'DJI_APP_ID',
  'DJI_APP_KEY'
];

// List of DJI API URLs for validation
const API_URLS = {
  CLOUD_API: 'https://api.dji.com',
  DEVELOPER_API: 'https://developer.dji.com',
  OPEN_API: 'https://open-api.dji.com',
};

// Key status
interface KeyStatus {
  key: string;
  present: boolean;
  value: string | null;
  truncatedValue: string | null;
  typical_format: string;
  typical_length: number;
  valid_format: boolean;
}

interface CredentialReport {
  timestamp: string;
  environmentKeys: KeyStatus[];
  missingKeys: string[];
  problems: string[];
  validationResults: any[];
  suggestions: string[];
}

/**
 * Main function to check API credentials
 */
export async function checkCredentials(options: {
  validateFormat?: boolean;
  testAuthentication?: boolean;
  verbose?: boolean;
  suggest?: boolean;
} = {}): Promise<CredentialReport> {
  const report: CredentialReport = {
    timestamp: new Date().toISOString(),
    environmentKeys: [],
    missingKeys: [],
    problems: [],
    validationResults: [],
    suggestions: []
  };

  // Ensure dotenv is loaded
  dotenv.config();
  
  if (options.verbose) {
    console.log(chalk.blue('\n==== Checking DJI API Credentials ====\n'));
  }
  
  // Check for required keys
  for (const key of REQUIRED_KEYS) {
    const value = process.env[key] || null;
    const present = value !== null && value !== '';
    
    // Typical format and length for different key types
    let typical_format = 'Unknown';
    let typical_length = 0;
    
    if (key.includes('_KEY')) {
      typical_format = 'alphanumeric, 32-64 characters';
      typical_length = 32;
    } else if (key.includes('_SECRET')) {
      typical_format = 'alphanumeric, 32-64 characters';
      typical_length = 32;
    } else if (key.includes('_ID')) {
      typical_format = 'alphanumeric, 16-32 characters';
      typical_length = 16;
    }
    
    // Validate format if requested
    let valid_format = true;
    if (options.validateFormat && value) {
      valid_format = value.length >= typical_length / 2;
    }
    
    // Generate a truncated value for display
    let truncatedValue = null;
    if (value) {
      truncatedValue = value.length > 8 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : '****';
    }
    
    // Add to report
    report.environmentKeys.push({
      key,
      present,
      value: null, // Never include actual value in reports
      truncatedValue,
      typical_format,
      typical_length,
      valid_format
    });
    
    // Add to missing keys if not present
    if (!present) {
      report.missingKeys.push(key);
      report.problems.push(`Missing required key: ${key}`);
    } else if (!valid_format) {
      report.problems.push(`Key ${key} may have an invalid format. Expected: ${typical_format}`);
    }
  }
  
  // Test authentication if requested
  if (options.testAuthentication) {
    // Cloud API test
    if (process.env.DJI_API_KEY && process.env.DJI_API_SECRET) {
      try {
        const result = await testCloudApiAuth();
        report.validationResults.push(result);
        
        if (!result.success) {
          report.problems.push(`Cloud API authentication failed: ${result.message}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.validationResults.push({
          apiType: 'Cloud API',
          success: false,
          message: `Error testing authentication: ${errorMessage}`,
          timestamp: new Date().toISOString()
        });
        report.problems.push(`Error testing Cloud API authentication: ${errorMessage}`);
      }
    }
    
    // Open API test
    if (process.env.DJI_OPEN_API_KEY && process.env.DJI_OPEN_API_SECRET) {
      try {
        const result = await testOpenApiAuth();
        report.validationResults.push(result);
        
        if (!result.success) {
          report.problems.push(`Open API authentication failed: ${result.message}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.validationResults.push({
          apiType: 'Open API',
          success: false,
          message: `Error testing authentication: ${errorMessage}`,
          timestamp: new Date().toISOString()
        });
        report.problems.push(`Error testing Open API authentication: ${errorMessage}`);
      }
    }
  }
  
  // Generate suggestions if requested
  if (options.suggest) {
    if (report.missingKeys.length > 0) {
      report.suggestions.push(`Add the missing keys (${report.missingKeys.join(', ')}) to your environment variables.`);
    }
    
    if (report.problems.length > 0 && report.problems.some(p => p.includes('invalid format'))) {
      report.suggestions.push('Review the format of your API keys and secrets to ensure they match DJI requirements.');
    }
    
    if (report.validationResults.some(r => !r.success)) {
      report.suggestions.push('Authentication is failing. Check that your credentials are correct and not expired.');
      report.suggestions.push('Verify that you have the appropriate permissions in your DJI Developer account.');
    }
  }
  
  // Print summary if verbose
  if (options.verbose) {
    printCredentialSummary(report);
  }
  
  return report;
}

/**
 * Test Cloud API Authentication
 */
async function testCloudApiAuth(): Promise<{
  apiType: string;
  success: boolean;
  message: string;
  tokenInfo?: any;
  timestamp: string;
}> {
  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URLS.CLOUD_API}/api/v1/oauth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        client_id: process.env.DJI_API_KEY || '',
        client_secret: process.env.DJI_API_SECRET || '',
        grant_type: 'client_credentials'
      }).toString(),
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-2xx
    });
    
    if (response.status === 200 && response.data && response.data.access_token) {
      return {
        apiType: 'Cloud API',
        success: true,
        message: 'Successfully authenticated with DJI Cloud API',
        tokenInfo: {
          expiresIn: response.data.expires_in,
          tokenType: response.data.token_type,
          obtainedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        apiType: 'Cloud API',
        success: false,
        message: `Authentication failed with status ${response.status}: ${JSON.stringify(response.data)}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      apiType: 'Cloud API',
      success: false,
      message: `Error during authentication: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Open API Authentication
 */
async function testOpenApiAuth(): Promise<{
  apiType: string;
  success: boolean;
  message: string;
  tokenInfo?: any;
  timestamp: string;
}> {
  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URLS.OPEN_API}/api/v1/oauth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        client_id: process.env.DJI_OPEN_API_KEY || '',
        client_secret: process.env.DJI_OPEN_API_SECRET || '',
        grant_type: 'client_credentials'
      }).toString(),
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-2xx
    });
    
    if (response.status === 200 && response.data && response.data.access_token) {
      return {
        apiType: 'Open API',
        success: true,
        message: 'Successfully authenticated with DJI Open API',
        tokenInfo: {
          expiresIn: response.data.expires_in,
          tokenType: response.data.token_type,
          obtainedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        apiType: 'Open API',
        success: false,
        message: `Authentication failed with status ${response.status}: ${JSON.stringify(response.data)}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      apiType: 'Open API',
      success: false,
      message: `Error during authentication: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Print a summary of the credential report
 */
function printCredentialSummary(report: CredentialReport): void {
  console.log(chalk.blue('======================================'));
  console.log(chalk.yellow('DJI API Credential Status'));
  console.log(chalk.blue('======================================'));
  
  // Print key status
  console.log(chalk.white('\nAPI Keys:'));
  for (const key of report.environmentKeys) {
    const status = key.present 
      ? (key.valid_format ? chalk.green('✓') : chalk.yellow('⚠')) 
      : chalk.red('✗');
    
    console.log(`  ${status} ${key.key}: ${key.present ? key.truncatedValue : 'Missing'}`);
    
    if (key.present && !key.valid_format) {
      console.log(chalk.yellow(`    Format warning: Expected ${key.typical_format}`));
    }
  }
  
  // Print validation results if any
  if (report.validationResults.length > 0) {
    console.log(chalk.white('\nAuthentication Tests:'));
    
    for (const result of report.validationResults) {
      const status = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${result.apiType}: ${result.message}`);
      
      if (result.success && result.tokenInfo) {
        console.log(chalk.gray(`    Token expires in: ${result.tokenInfo.expiresIn} seconds`));
      }
    }
  }
  
  // Print problems if any
  if (report.problems.length > 0) {
    console.log(chalk.white('\nProblems Detected:'));
    
    for (const problem of report.problems) {
      console.log(chalk.red(`  • ${problem}`));
    }
  }
  
  // Print suggestions if any
  if (report.suggestions.length > 0) {
    console.log(chalk.white('\nSuggestions:'));
    
    for (const suggestion of report.suggestions) {
      console.log(chalk.yellow(`  • ${suggestion}`));
    }
  }
  
  console.log(chalk.blue('\n======================================\n'));
}

// Export utility functions
export {
  testCloudApiAuth,
  testOpenApiAuth,
  printCredentialSummary
};

// Main function for direct execution (ESM-compatible approach)
export async function main() {
  try {
    await checkCredentials({
      validateFormat: true,
      testAuthentication: true,
      verbose: true,
      suggest: true
    });
    return 0; // success
  } catch (error) {
    console.error('Error checking credentials:', error);
    return 1; // error
  }
}

// Run main if executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  main().then(exitCode => {
    process.exit(exitCode);
  });
}