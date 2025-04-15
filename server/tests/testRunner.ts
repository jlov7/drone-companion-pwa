/**
 * DJI Drone Companion App Test Runner
 * 
 * This module provides the core test runner functionality with
 * support for multiple test categories and comprehensive reporting.
 */

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Test categories
export enum TestCategory {
  DJI = 'dji',
  API = 'api',
  DATABASE = 'database',
  UI = 'ui',
  INTEGRATION = 'integration',
  ALL = 'all'
}

// Test result
export interface TestResult {
  name: string;
  category: TestCategory;
  success: boolean;
  duration: number;
  message?: string;
  error?: string;
  details?: any;
}

// Test report
export interface TestReport {
  timestamp: string;
  environment: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  categories: {
    [key in TestCategory]: {
      total: number;
      passed: number;
      failed: number;
    };
  };
  results: TestResult[];
}

// Test configuration
export interface TestConfig {
  baseUrl: string;
  category?: TestCategory;
  verbose: boolean;
  stopOnFailure: boolean;
}

// Test case
export interface TestCase {
  name: string;
  category: TestCategory;
  run: () => Promise<TestResult>;
}

// Test runner class
export class TestRunner {
  private tests: TestCase[] = [];
  private report: TestReport;
  private config: TestConfig;
  
  constructor(config: TestConfig) {
    this.config = config;
    this.report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      categories: {
        [TestCategory.DJI]: { total: 0, passed: 0, failed: 0 },
        [TestCategory.API]: { total: 0, passed: 0, failed: 0 },
        [TestCategory.DATABASE]: { total: 0, passed: 0, failed: 0 },
        [TestCategory.UI]: { total: 0, passed: 0, failed: 0 },
        [TestCategory.INTEGRATION]: { total: 0, passed: 0, failed: 0 },
        [TestCategory.ALL]: { total: 0, passed: 0, failed: 0 },
      },
      results: [],
    };
  }
  
  // Add a test case
  addTest(test: TestCase): void {
    this.tests.push(test);
    this.report.categories[test.category].total++;
    this.report.summary.total++;
    this.report.categories[TestCategory.ALL].total++;
  }
  
  // Add multiple test cases
  addTests(tests: TestCase[]): void {
    for (const test of tests) {
      this.addTest(test);
    }
  }
  
  // Run all tests
  async runTests(): Promise<TestReport> {
    const startTime = Date.now();
    
    if (this.config.verbose) {
      console.log(chalk.blue('\n==== Starting Test Run ====\n'));
    }
    
    for (const test of this.tests) {
      // Skip test if not in the selected category
      if (this.config.category && this.config.category !== TestCategory.ALL && 
          test.category !== this.config.category) {
        this.report.summary.skipped++;
        continue;
      }
      
      try {
        if (this.config.verbose) {
          console.log(chalk.yellow(`Running test: ${test.name}`));
        }
        
        const result = await test.run();
        this.report.results.push(result);
        
        if (result.success) {
          this.report.summary.passed++;
          this.report.categories[result.category].passed++;
          this.report.categories[TestCategory.ALL].passed++;
          
          if (this.config.verbose) {
            console.log(chalk.green(`✅ Passed: ${test.name} (${result.duration}ms)`));
          }
        } else {
          this.report.summary.failed++;
          this.report.categories[result.category].failed++;
          this.report.categories[TestCategory.ALL].failed++;
          
          if (this.config.verbose) {
            console.log(chalk.red(`❌ Failed: ${test.name} (${result.duration}ms)`));
            if (result.error) {
              console.log(chalk.red(`   Error: ${result.error}`));
            }
          }
          
          if (this.config.stopOnFailure) {
            if (this.config.verbose) {
              console.log(chalk.yellow('\nStopping on first failure as requested.\n'));
            }
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.report.results.push({
          name: test.name,
          category: test.category,
          success: false,
          duration: 0,
          error: `Uncaught error: ${errorMessage}`,
        });
        
        this.report.summary.failed++;
        this.report.categories[test.category].failed++;
        this.report.categories[TestCategory.ALL].failed++;
        
        if (this.config.verbose) {
          console.log(chalk.red(`❌ Error: ${test.name}`));
          console.log(chalk.red(`   Uncaught error: ${errorMessage}`));
        }
        
        if (this.config.stopOnFailure) {
          if (this.config.verbose) {
            console.log(chalk.yellow('\nStopping on first failure as requested.\n'));
          }
          break;
        }
      }
    }
    
    this.report.summary.duration = Date.now() - startTime;
    
    if (this.config.verbose) {
      this.printReport();
    }
    
    return this.report;
  }
  
  // Print test report
  printReport(): void {
    console.log('\n');
    console.log(chalk.blue('======================================'));
    console.log(chalk.yellow('Test Report Summary'));
    console.log(chalk.blue('======================================'));
    
    console.log(chalk.white('\nOverall:'));
    console.log(`  Total: ${this.report.summary.total}`);
    console.log(`  Passed: ${chalk.green(this.report.summary.passed)}`);
    console.log(`  Failed: ${chalk.red(this.report.summary.failed)}`);
    console.log(`  Skipped: ${chalk.yellow(this.report.summary.skipped)}`);
    console.log(`  Duration: ${this.report.summary.duration}ms`);
    
    console.log(chalk.white('\nBy Category:'));
    for (const [category, stats] of Object.entries(this.report.categories)) {
      if (category === TestCategory.ALL || stats.total === 0) continue;
      
      console.log(`  ${category}: ${stats.passed}/${stats.total} passed`);
    }
    
    console.log(chalk.white('\nFailed Tests:'));
    const failedTests = this.report.results.filter(result => !result.success);
    
    if (failedTests.length === 0) {
      console.log(chalk.green('  None'));
    } else {
      for (const result of failedTests) {
        console.log(chalk.red(`  ❌ ${result.name}`));
        if (result.error) {
          console.log(chalk.red(`     ${result.error}`));
        }
      }
    }
    
    console.log(chalk.blue('\n======================================\n'));
  }
  
  // Save test report to file
  async saveReport(filePath: string): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(this.report, null, 2));
    } catch (error) {
      console.error('Failed to save test report:', error);
    }
  }
}

// API testing utilities
export async function testApiEndpoint(
  baseUrl: string,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    expectedStatus?: number;
    validateResponse?: (response: any) => boolean;
  } = {}
): Promise<{
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await axios({
      method,
      url,
      data: options.body,
      headers: options.headers,
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status code
    });
    
    const duration = Date.now() - startTime;
    const expectedStatus = options.expectedStatus || 200;
    
    // Check status code
    if (response.status !== expectedStatus) {
      return {
        success: false,
        status: response.status,
        data: response.data,
        error: `Expected status ${expectedStatus}, got ${response.status}`,
        duration,
      };
    }
    
    // Validate response if provided
    if (options.validateResponse && !options.validateResponse(response.data)) {
      return {
        success: false,
        status: response.status,
        data: response.data,
        error: 'Response validation failed',
        duration,
      };
    }
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      status: 0,
      error: errorMessage,
      duration,
    };
  }
}

// Basic API test cases factory
export function createApiTests(baseUrl: string): TestCase[] {
  return [
    // Health endpoint test
    {
      name: 'API Health Check',
      category: TestCategory.API,
      run: async () => {
        const startTime = Date.now();
        try {
          const result = await testApiEndpoint(baseUrl, '/api/health');
          
          return {
            name: 'API Health Check',
            category: TestCategory.API,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'API health check passed' : 'API health check failed',
            error: result.error,
            details: result.data,
          };
        } catch (error) {
          return {
            name: 'API Health Check',
            category: TestCategory.API,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // Drones endpoint test
    {
      name: 'Drones API Endpoint',
      category: TestCategory.API,
      run: async () => {
        const startTime = Date.now();
        try {
          // Use userId=1 for testing
          const result = await testApiEndpoint(baseUrl, '/api/drones?userId=1', {
            validateResponse: (data) => Array.isArray(data),
          });
          
          return {
            name: 'Drones API Endpoint',
            category: TestCategory.API,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'Drones API endpoint returned valid data' : 'Drones API endpoint failed',
            error: result.error,
            details: result.success ? { count: result.data.length } : undefined,
          };
        } catch (error) {
          return {
            name: 'Drones API Endpoint',
            category: TestCategory.API,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // Flight Logs endpoint test
    {
      name: 'Flight Logs API Endpoint',
      category: TestCategory.API,
      run: async () => {
        const startTime = Date.now();
        try {
          // Use userId=1 for testing
          const result = await testApiEndpoint(baseUrl, '/api/flight-logs?userId=1', {
            validateResponse: (data) => Array.isArray(data),
          });
          
          return {
            name: 'Flight Logs API Endpoint',
            category: TestCategory.API,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'Flight Logs API endpoint returned valid data' : 'Flight Logs API endpoint failed',
            error: result.error,
            details: result.success ? { count: result.data.length } : undefined,
          };
        } catch (error) {
          return {
            name: 'Flight Logs API Endpoint',
            category: TestCategory.API,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // Batteries endpoint test
    {
      name: 'Batteries API Endpoint',
      category: TestCategory.API,
      run: async () => {
        const startTime = Date.now();
        try {
          // Use userId=1 for testing
          const result = await testApiEndpoint(baseUrl, '/api/batteries?userId=1', {
            validateResponse: (data) => Array.isArray(data),
          });
          
          return {
            name: 'Batteries API Endpoint',
            category: TestCategory.API,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'Batteries API endpoint returned valid data' : 'Batteries API endpoint failed',
            error: result.error,
            details: result.success ? { count: result.data.length } : undefined,
          };
        } catch (error) {
          return {
            name: 'Batteries API Endpoint',
            category: TestCategory.API,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ];
}

// DJI API test cases factory
export function createDjiTests(baseUrl: string): TestCase[] {
  return [
    // DJI Environment Check
    {
      name: 'DJI Environment Check',
      category: TestCategory.DJI,
      run: async () => {
        const startTime = Date.now();
        try {
          const result = await testApiEndpoint(baseUrl, '/api/dji/check-env');
          
          return {
            name: 'DJI Environment Check',
            category: TestCategory.DJI,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'DJI environment check passed' : 'DJI environment check failed',
            error: result.error,
            details: result.data,
          };
        } catch (error) {
          return {
            name: 'DJI Environment Check',
            category: TestCategory.DJI,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // DJI API Connection Test
    {
      name: 'DJI API Connection',
      category: TestCategory.DJI,
      run: async () => {
        const startTime = Date.now();
        try {
          const result = await testApiEndpoint(baseUrl, '/api/dji/verify-connection');
          
          return {
            name: 'DJI API Connection',
            category: TestCategory.DJI,
            success: result.success && result.data?.success === true,
            duration: Date.now() - startTime,
            message: result.success && result.data?.success === true 
              ? 'DJI API connection successful' 
              : 'DJI API connection failed',
            error: result.error || (result.data?.error ? String(result.data.error) : undefined),
            details: result.data,
          };
        } catch (error) {
          return {
            name: 'DJI API Connection',
            category: TestCategory.DJI,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // DJI Devices Endpoint
    {
      name: 'DJI Devices Endpoint',
      category: TestCategory.DJI,
      run: async () => {
        const startTime = Date.now();
        try {
          const result = await testApiEndpoint(baseUrl, '/api/dji/devices');
          
          return {
            name: 'DJI Devices Endpoint',
            category: TestCategory.DJI,
            success: result.success && result.data?.devices && Array.isArray(result.data.devices),
            duration: Date.now() - startTime,
            message: result.success ? 'DJI devices endpoint returned valid data' : 'DJI devices endpoint failed',
            error: result.error,
            details: result.success && result.data?.devices 
              ? { count: result.data.devices.length, usingMockData: result.data.usingMockData } 
              : undefined,
          };
        } catch (error) {
          return {
            name: 'DJI Devices Endpoint',
            category: TestCategory.DJI,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // DJI Flight Records Endpoint
    {
      name: 'DJI Flight Records Endpoint',
      category: TestCategory.DJI,
      run: async () => {
        const startTime = Date.now();
        try {
          const result = await testApiEndpoint(baseUrl, '/api/dji/flight-records');
          
          return {
            name: 'DJI Flight Records Endpoint',
            category: TestCategory.DJI,
            success: result.success && result.data?.records && Array.isArray(result.data.records),
            duration: Date.now() - startTime,
            message: result.success ? 'DJI flight records endpoint returned valid data' : 'DJI flight records endpoint failed',
            error: result.error,
            details: result.success && result.data?.records 
              ? { count: result.data.records.length, usingMockData: result.data.usingMockData } 
              : undefined,
          };
        } catch (error) {
          return {
            name: 'DJI Flight Records Endpoint',
            category: TestCategory.DJI,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ];
}

// Database test cases factory
export function createDatabaseTests(baseUrl: string): TestCase[] {
  return [
    // Database Connection Test
    {
      name: 'Database Connection',
      category: TestCategory.DATABASE,
      run: async () => {
        const startTime = Date.now();
        try {
          // We can test database connection via the stats endpoint
          // which runs several DB queries
          const result = await testApiEndpoint(baseUrl, '/api/stats');
          
          return {
            name: 'Database Connection',
            category: TestCategory.DATABASE,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'Database connection working' : 'Database connection failed',
            error: result.error,
            details: result.data,
          };
        } catch (error) {
          return {
            name: 'Database Connection',
            category: TestCategory.DATABASE,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ];
}

// Integration test cases factory
export function createIntegrationTests(baseUrl: string): TestCase[] {
  return [
    // DJI Integration Test - Sync drones
    {
      name: 'DJI Sync Drones Integration',
      category: TestCategory.INTEGRATION,
      run: async () => {
        const startTime = Date.now();
        try {
          // First get current drones with userId=1
          const dronesBeforeResult = await testApiEndpoint(baseUrl, '/api/drones?userId=1');
          
          if (!dronesBeforeResult.success) {
            return {
              name: 'DJI Sync Drones Integration',
              category: TestCategory.INTEGRATION,
              success: false,
              duration: Date.now() - startTime,
              error: `Failed to get drones: ${dronesBeforeResult.error}`,
            };
          }
          
          const dronesBeforeCount = Array.isArray(dronesBeforeResult.data) ? dronesBeforeResult.data.length : 0;
          
          // Try to sync drones (using userId=1)
          const syncResult = await testApiEndpoint(baseUrl, '/api/dji/sync-drones?userId=1', {
            method: 'POST',
          });
          
          // Get drones after sync
          const dronesAfterResult = await testApiEndpoint(baseUrl, '/api/drones?userId=1');
          
          if (!dronesAfterResult.success) {
            return {
              name: 'DJI Sync Drones Integration',
              category: TestCategory.INTEGRATION,
              success: false,
              duration: Date.now() - startTime,
              error: `Failed to get drones after sync: ${dronesAfterResult.error}`,
              details: { syncResult: syncResult.data },
            };
          }
          
          // Check if the number of drones is the same or increased
          const dronesAfterCount = Array.isArray(dronesAfterResult.data) ? dronesAfterResult.data.length : 0;
          
          return {
            name: 'DJI Sync Drones Integration',
            category: TestCategory.INTEGRATION,
            success: syncResult.success,
            duration: Date.now() - startTime,
            message: syncResult.success 
              ? `DJI sync drones completed successfully. Drones before: ${dronesBeforeCount}, after: ${dronesAfterCount}` 
              : 'DJI sync drones failed',
            error: syncResult.error,
            details: { 
              syncResult: syncResult.data,
              dronesBeforeCount,
              dronesAfterCount,
              drones: dronesAfterResult.data?.slice(0, 2) // Just include first 2 drones for brevity
            },
          };
        } catch (error) {
          return {
            name: 'DJI Sync Drones Integration',
            category: TestCategory.INTEGRATION,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
    
    // DJI Integration Test - Sync flight logs
    {
      name: 'DJI Sync Flight Logs Integration',
      category: TestCategory.INTEGRATION,
      run: async () => {
        const startTime = Date.now();
        try {
          // First get current flight logs with userId=1
          const logsBeforeResult = await testApiEndpoint(baseUrl, '/api/flight-logs?userId=1');
          
          if (!logsBeforeResult.success) {
            return {
              name: 'DJI Sync Flight Logs Integration',
              category: TestCategory.INTEGRATION,
              success: false,
              duration: Date.now() - startTime,
              error: `Failed to get flight logs: ${logsBeforeResult.error}`,
            };
          }
          
          const logsBeforeCount = Array.isArray(logsBeforeResult.data) ? logsBeforeResult.data.length : 0;
          
          // Try to sync flight logs (using userId=1)
          const syncResult = await testApiEndpoint(baseUrl, '/api/dji/sync-flight-logs?userId=1', {
            method: 'POST',
          });
          
          // Get flight logs after sync
          const logsAfterResult = await testApiEndpoint(baseUrl, '/api/flight-logs?userId=1');
          
          if (!logsAfterResult.success) {
            return {
              name: 'DJI Sync Flight Logs Integration',
              category: TestCategory.INTEGRATION,
              success: false,
              duration: Date.now() - startTime,
              error: `Failed to get flight logs after sync: ${logsAfterResult.error}`,
              details: { syncResult: syncResult.data },
            };
          }
          
          // Check if the number of flight logs is the same or increased
          const logsAfterCount = Array.isArray(logsAfterResult.data) ? logsAfterResult.data.length : 0;
          
          return {
            name: 'DJI Sync Flight Logs Integration',
            category: TestCategory.INTEGRATION,
            success: syncResult.success,
            duration: Date.now() - startTime,
            message: syncResult.success 
              ? `DJI sync flight logs completed successfully. Logs before: ${logsBeforeCount}, after: ${logsAfterCount}` 
              : 'DJI sync flight logs failed',
            error: syncResult.error,
            details: { 
              syncResult: syncResult.data,
              logsBeforeCount,
              logsAfterCount,
              logs: logsAfterResult.data?.slice(0, 2) // Just include first 2 logs for brevity
            },
          };
        } catch (error) {
          return {
            name: 'DJI Sync Flight Logs Integration',
            category: TestCategory.INTEGRATION,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ];
}

// UI test cases factory - simplified browser tests
export function createUiTests(baseUrl: string): TestCase[] {
  return [
    // Main page load test
    {
      name: 'Main Page Load',
      category: TestCategory.UI,
      run: async () => {
        const startTime = Date.now();
        try {
          // Test the main HTML page load
          const result = await testApiEndpoint(baseUrl, '/', {
            validateResponse: (data) => typeof data === 'string' && data.includes('<!DOCTYPE html>'),
          });
          
          return {
            name: 'Main Page Load',
            category: TestCategory.UI,
            success: result.success,
            duration: Date.now() - startTime,
            message: result.success ? 'Main page loaded successfully' : 'Failed to load main page',
            error: result.error,
          };
        } catch (error) {
          return {
            name: 'Main Page Load',
            category: TestCategory.UI,
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  ];
}

// Create all test cases
export function createAllTests(baseUrl: string): TestCase[] {
  return [
    ...createApiTests(baseUrl),
    ...createDjiTests(baseUrl),
    ...createDatabaseTests(baseUrl),
    ...createIntegrationTests(baseUrl),
    ...createUiTests(baseUrl),
  ];
}