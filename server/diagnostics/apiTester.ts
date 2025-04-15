/**
 * DJI API Diagnostics Tool
 * 
 * This tool provides advanced diagnostics for the DJI API integration.
 * It performs comprehensive testing of all API endpoints, authentication,
 * and connectivity, providing detailed reports on issues found.
 */

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { mockDevices, mockFlightRecords } from '../djiMockData';

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  reportDir: './diagnostics-reports',
  timeout: 5000, // ms
  retryAttempts: 3,
  endpoints: {
    health: '/api/health',
    djiCheck: '/api/dji/check-env',
    djiVerify: '/api/dji/verify-connection',
    djiTestLog: '/api/dji/test-logging',
    djiDevices: '/api/dji/devices',
    djiFlightRecords: '/api/dji/flight-records',
  },
  djiDomains: [
    'api.dji.com',
    'developer.dji.com',
    'open-api.dji.com',
    'account.dji.com',
    'www.dji.com'
  ]
};

// Result types
interface DiagnosticResult {
  name: string;
  success: boolean;
  timestamp: string;
  duration: number;
  details?: any;
  error?: string;
  recommendation?: string;
}

interface ApiResult {
  endpoint: string;
  status: number;
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

interface DiagnosticReport {
  timestamp: string;
  serverInfo: {
    version: string;
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
  networkConnectivity: {
    internet: boolean;
    djiDomains: Record<string, boolean | string>;
  };
  apiKeys: {
    available: string[];
    missing: string[];
    allPresent: boolean;
  };
  apiEndpoints: Record<string, ApiResult>;
  djiApiTests: DiagnosticResult[];
  overallStatus: 'success' | 'partial' | 'failure';
  recommendations: string[];
}

/**
 * Runs comprehensive API diagnostics
 */
export async function runFullDiagnostics(options: {
  save?: boolean;
  verbose?: boolean;
  ignoreFailures?: boolean;
} = {}): Promise<DiagnosticReport> {
  const startTime = Date.now();
  
  if (options.verbose) {
    console.log(chalk.blue('==== Starting DJI API Diagnostics ===='));
  }
  
  // Create report directory if it doesn't exist and saving is enabled
  if (options.save) {
    try {
      await fs.mkdir(CONFIG.reportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create report directory:', error);
    }
  }
  
  // Initialize the report
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    serverInfo: {
      version: 'unknown',
      uptime: 0,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'unknown',
    },
    networkConnectivity: {
      internet: false,
      djiDomains: {},
    },
    apiKeys: {
      available: [],
      missing: [],
      allPresent: false,
    },
    apiEndpoints: {},
    djiApiTests: [],
    overallStatus: 'failure',
    recommendations: [],
  };
  
  try {
    // 1. Check basic server connectivity
    const serverTest = await testEndpoint(CONFIG.endpoints.health);
    report.apiEndpoints['health'] = serverTest;
    
    if (serverTest.success && serverTest.data) {
      report.serverInfo = {
        version: serverTest.data.version || 'unknown',
        uptime: serverTest.data.uptime || 0,
        nodeVersion: process.version,
        environment: serverTest.data.environment || process.env.NODE_ENV || 'unknown',
      };
    } else {
      report.recommendations.push('Server connectivity issue detected. Make sure the server is running and accessible.');
    }
    
    // 2. Test network connectivity
    const internetResult = await checkInternetConnectivity();
    report.networkConnectivity.internet = internetResult.success;
    
    // 3. Test DJI domain connectivity
    for (const domain of CONFIG.djiDomains) {
      try {
        const domainResult = await checkDomainConnectivity(domain);
        report.networkConnectivity.djiDomains[domain] = domainResult.success;
        
        if (!domainResult.success) {
          report.recommendations.push(`Unable to connect to ${domain}. This might indicate network restrictions.`);
        }
      } catch (error) {
        report.networkConnectivity.djiDomains[domain] = false;
        report.recommendations.push(`Connection to ${domain} failed. Check network connectivity.`);
      }
    }
    
    // 4. Check API keys
    const apiKeyTest = await testEndpoint(CONFIG.endpoints.djiCheck);
    report.apiEndpoints['djiCheck'] = apiKeyTest;
    
    if (apiKeyTest.success && apiKeyTest.data) {
      report.apiKeys = {
        available: apiKeyTest.data.availableKeys || [],
        missing: apiKeyTest.data.missingKeys || [],
        allPresent: apiKeyTest.data.allKeysAvailable || false,
      };
      
      if (!apiKeyTest.data.allKeysAvailable) {
        report.recommendations.push('Some DJI API keys are missing. Consider adding them for full functionality.');
      }
    }
    
    // 5. Test DJI API connectivity
    const djiVerifyTest = await testEndpoint(CONFIG.endpoints.djiVerify);
    report.apiEndpoints['djiVerify'] = djiVerifyTest;
    
    report.djiApiTests.push({
      name: 'DJI API Connection',
      success: djiVerifyTest.success && djiVerifyTest.data?.success === true,
      timestamp: new Date().toISOString(),
      duration: djiVerifyTest.duration,
      details: djiVerifyTest.data,
      error: djiVerifyTest.error || (djiVerifyTest.data?.error ? String(djiVerifyTest.data.error) : undefined),
      recommendation: djiVerifyTest.success && djiVerifyTest.data?.success === true 
        ? 'DJI API connection is working correctly.'
        : 'DJI API connection failed. Check credentials and network connectivity.'
    });
    
    if (djiVerifyTest.success && djiVerifyTest.data?.domainTests) {
      report.djiApiTests.push({
        name: 'DJI Domain Tests',
        success: djiVerifyTest.data.domainTests.some((test: any) => test.success),
        timestamp: new Date().toISOString(),
        duration: djiVerifyTest.duration,
        details: djiVerifyTest.data.domainTests,
        recommendation: 'Domain connectivity is critical for DJI API integration.'
      });
    }
    
    // 6. Test advanced API diagnostics
    const djiTestLogTest = await testEndpoint(CONFIG.endpoints.djiTestLog);
    report.apiEndpoints['djiTestLog'] = djiTestLogTest;
    
    if (djiTestLogTest.success) {
      report.djiApiTests.push({
        name: 'DJI API Logging Test',
        success: true,
        timestamp: new Date().toISOString(),
        duration: djiTestLogTest.duration,
        details: djiTestLogTest.data,
        recommendation: 'API logging is working correctly.'
      });
    }
    
    // 7. Test device listing endpoint
    const djiDevicesTest = await testEndpoint(CONFIG.endpoints.djiDevices);
    report.apiEndpoints['djiDevices'] = djiDevicesTest;
    
    if (djiDevicesTest.success && djiDevicesTest.data?.devices) {
      const usingMockData = JSON.stringify(djiDevicesTest.data.devices) === JSON.stringify(mockDevices);
      
      report.djiApiTests.push({
        name: 'DJI Devices Endpoint',
        success: true,
        timestamp: new Date().toISOString(),
        duration: djiDevicesTest.duration,
        details: {
          deviceCount: djiDevicesTest.data.devices.length,
          usingMockData,
          devices: djiDevicesTest.data.devices
        },
        recommendation: usingMockData 
          ? 'Using mock data. Consider connecting to real DJI API for production use.'
          : 'Successfully retrieving real device data from DJI API.'
      });
    } else {
      report.djiApiTests.push({
        name: 'DJI Devices Endpoint',
        success: false,
        timestamp: new Date().toISOString(),
        duration: djiDevicesTest.duration,
        error: djiDevicesTest.error || 'Failed to retrieve devices data',
        recommendation: 'Check API integration and credentials for device listing.'
      });
    }
    
    // 8. Test flight records endpoint
    const djiFlightRecordsTest = await testEndpoint(CONFIG.endpoints.djiFlightRecords);
    report.apiEndpoints['djiFlightRecords'] = djiFlightRecordsTest;
    
    if (djiFlightRecordsTest.success && djiFlightRecordsTest.data?.records) {
      // Check if using mock data by checking if the records are structurally the same
      // This is a simplification and might not be accurate in all cases
      let usingMockData = false;
      if (mockFlightRecords && typeof mockFlightRecords === 'object') {
        const mockRecordsValues = Object.values(mockFlightRecords);
        if (mockRecordsValues.length > 0) {
          const mockFirstRecord = mockRecordsValues[0];
          if (Array.isArray(mockFirstRecord)) {
            usingMockData = djiFlightRecordsTest.data.records.length === mockFirstRecord.length;
          }
        }
      }
      
      report.djiApiTests.push({
        name: 'DJI Flight Records Endpoint',
        success: true,
        timestamp: new Date().toISOString(),
        duration: djiFlightRecordsTest.duration,
        details: {
          recordCount: djiFlightRecordsTest.data.records.length,
          usingMockData,
          firstRecord: djiFlightRecordsTest.data.records[0] || null
        },
        recommendation: usingMockData 
          ? 'Using mock flight data. Consider connecting to real DJI API for production use.'
          : 'Successfully retrieving real flight record data from DJI API.'
      });
    } else {
      report.djiApiTests.push({
        name: 'DJI Flight Records Endpoint',
        success: false,
        timestamp: new Date().toISOString(),
        duration: djiFlightRecordsTest.duration,
        error: djiFlightRecordsTest.error || 'Failed to retrieve flight records data',
        recommendation: 'Check API integration and credentials for flight record listing.'
      });
    }
    
    // 9. Determine overall status
    const allTestsPassing = Object.values(report.apiEndpoints).every(result => result.success);
    const criticalTestsPassing = report.apiEndpoints['health']?.success && 
                               report.apiEndpoints['djiCheck']?.success;
    const someTestsPassing = Object.values(report.apiEndpoints).some(result => result.success);
    
    if (allTestsPassing) {
      report.overallStatus = 'success';
    } else if (criticalTestsPassing && someTestsPassing) {
      report.overallStatus = 'partial';
    } else {
      report.overallStatus = 'failure';
    }
    
    // 10. Generate recommendations
    if (report.overallStatus === 'failure') {
      report.recommendations.push('Critical API failures detected. Check server and network connectivity.');
    } else if (report.overallStatus === 'partial') {
      report.recommendations.push('Some API endpoints are functioning, but others are failing. Review specific failures above.');
    }
    
    // 11. Add general recommendations based on test results
    if (!report.networkConnectivity.internet) {
      report.recommendations.push('No internet connectivity detected. Check your network connection.');
    }
    
    if (Object.values(report.networkConnectivity.djiDomains).some(result => !result)) {
      report.recommendations.push('Some DJI domains are unreachable. This might indicate network restrictions or DNS issues.');
    }
    
    // 12. Save report if requested
    if (options.save) {
      const filename = `dji-api-diagnostics-${new Date().toISOString().replace(/:/g, '-')}.json`;
      const reportPath = path.join(CONFIG.reportDir, filename);
      
      try {
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        if (options.verbose) {
          console.log(chalk.green(`Diagnostic report saved to ${reportPath}`));
        }
      } catch (error) {
        console.error('Failed to save diagnostic report:', error);
      }
    }
    
    // 13. Print summary if verbose
    if (options.verbose) {
      printDiagnosticSummary(report);
    }
    
    return report;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    report.overallStatus = 'failure';
    report.recommendations.push(`Diagnostic test failed with error: ${errorMessage}`);
    
    if (options.verbose) {
      console.error(chalk.red('Diagnostic testing failed:'), errorMessage);
    }
    
    if (options.ignoreFailures) {
      return report;
    } else {
      throw error;
    }
  } finally {
    const totalDuration = Date.now() - startTime;
    
    if (options.verbose) {
      console.log(chalk.blue(`==== Diagnostics completed in ${totalDuration}ms ====`));
    }
  }
}

/**
 * Test a specific API endpoint
 */
async function testEndpoint(endpoint: string): Promise<ApiResult> {
  const startTime = Date.now();
  const url = `${CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await axios.get(url, {
      timeout: CONFIG.timeout,
      validateStatus: () => true, // Don't throw on non-2xx status codes
    });
    
    return {
      endpoint,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      duration: Date.now() - startTime,
      data: response.data
    };
  } catch (error) {
    return {
      endpoint,
      status: 0,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if internet is available
 */
async function checkInternetConnectivity(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try multiple reliable services
    const services = [
      'https://www.google.com',
      'https://www.cloudflare.com',
      'https://www.amazon.com'
    ];
    
    // Try each service until one succeeds
    for (const service of services) {
      try {
        const response = await axios.get(service, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        if (response.status >= 200 && response.status < 500) {
          return { success: true };
        }
      } catch (error) {
        // Continue to the next service
      }
    }
    
    // If all services failed
    return { success: false, error: 'All connectivity checks failed' };
  } catch (error) {
    return { 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if a specific domain is reachable
 */
async function checkDomainConnectivity(domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await axios.get(`https://${domain}`, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    // Any response indicates the domain is reachable
    return { success: true };
  } catch (error) {
    return { 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Print a summary of the diagnostic report
 */
function printDiagnosticSummary(report: DiagnosticReport): void {
  console.log('\n');
  console.log(chalk.blue('======================================'));
  console.log(chalk.yellow('DJI API Diagnostics Summary'));
  console.log(chalk.blue('======================================'));
  
  console.log(chalk.white('Server Info:'));
  console.log(`  Environment: ${report.serverInfo.environment}`);
  console.log(`  Version: ${report.serverInfo.version}`);
  console.log(`  Uptime: ${report.serverInfo.uptime} seconds`);
  
  console.log(chalk.white('\nNetwork Connectivity:'));
  console.log(`  Internet: ${report.networkConnectivity.internet ? chalk.green('✓') : chalk.red('✗')}`);
  
  console.log(chalk.white('\nDJI Domains:'));
  for (const [domain, accessible] of Object.entries(report.networkConnectivity.djiDomains)) {
    console.log(`  ${domain}: ${accessible ? chalk.green('✓') : chalk.red('✗')}`);
  }
  
  console.log(chalk.white('\nAPI Keys:'));
  console.log(`  All Present: ${report.apiKeys.allPresent ? chalk.green('✓') : chalk.yellow('Partial')}`);
  if (report.apiKeys.missing.length > 0) {
    console.log(`  Missing: ${chalk.yellow(report.apiKeys.missing.join(', '))}`);
  }
  
  console.log(chalk.white('\nAPI Endpoints:'));
  for (const [endpoint, result] of Object.entries(report.apiEndpoints)) {
    console.log(`  ${endpoint}: ${result.success ? chalk.green('✓') : chalk.red('✗')} (${result.status})`);
  }
  
  console.log(chalk.white('\nDJI API Tests:'));
  for (const test of report.djiApiTests) {
    console.log(`  ${test.name}: ${test.success ? chalk.green('✓') : chalk.red('✗')}`);
    if (test.error) {
      console.log(`    Error: ${chalk.red(test.error)}`);
    }
  }
  
  console.log(chalk.white('\nOverall Status:'));
  if (report.overallStatus === 'success') {
    console.log(chalk.green('  All systems operational'));
  } else if (report.overallStatus === 'partial') {
    console.log(chalk.yellow('  Partially operational'));
  } else {
    console.log(chalk.red('  System failure'));
  }
  
  console.log(chalk.white('\nRecommendations:'));
  for (const recommendation of report.recommendations) {
    console.log(`  - ${recommendation}`);
  }
  
  console.log(chalk.blue('\n======================================\n'));
}

// Export utility functions
export {
  testEndpoint,
  checkInternetConnectivity,
  checkDomainConnectivity,
  printDiagnosticSummary
};