import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Network, 
  Server, 
  Key, 
  RefreshCw,
  ExternalLink,
  Globe,
  Shield
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  checkDJIApiKeys, 
  runDJINetworkDiagnostics, 
  verifyDJIOpenApiConnection,
  NetworkDiagnosticsResult,
  ApiKeyStatus,
  DJIConnectionStatus
} from '@/lib/djiOpenApi';

export interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  timestamp: Date;
  icon?: React.ReactNode;
}

const DJINetworkDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');

  const runDiagnostics = async () => {
    setLoading(true);
    setOverallStatus('pending');
    
    // Start with a clean slate
    setDiagnostics([
      {
        name: 'Starting diagnostics...',
        status: 'pending',
        message: 'Initializing diagnostic tests',
        timestamp: new Date(),
        icon: <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      }
    ]);

    try {
      const newDiagnostics: DiagnosticResult[] = [];
      
      // 1. Check for API key configuration
      const apiKeyStatus = await checkDJIApiKeys();
      newDiagnostics.push({
        name: 'API Key Configuration',
        status: apiKeyStatus.allKeysAvailable ? 'success' : 'warning',
        message: apiKeyStatus.message,
        details: `Available keys: ${apiKeyStatus.availableKeys.join(', ')}\nMissing keys: ${apiKeyStatus.missingKeys.join(', ')}`,
        timestamp: new Date(),
        icon: <Key className="mr-2 h-4 w-4" />
      });

      // 2. Run network connectivity tests
      const networkStatus = await runDJINetworkDiagnostics();
      const networkResult: DiagnosticResult = {
        name: 'Network Connectivity',
        status: networkStatus.allDomainsReachable ? 'success' : 'warning',
        message: networkStatus.message,
        details: Object.entries(networkStatus.domainStatus)
          .map(([domain, status]) => `${domain}: ${status === true ? 'Reachable' : status}`)
          .join('\n'),
        timestamp: new Date(),
        icon: <Network className="mr-2 h-4 w-4" />
      };
      newDiagnostics.push(networkResult);

      // 3. Full API connection test with all API types
      try {
        const connectionStatus = await verifyDJIOpenApiConnection();
        const authStatus: DiagnosticResult = {
          name: 'API Authentication',
          status: connectionStatus.success ? 'success' : 'error',
          message: connectionStatus.message,
          details: connectionStatus.error,
          timestamp: new Date(),
          icon: <Shield className="mr-2 h-4 w-4" />
        };
        newDiagnostics.push(authStatus);
        
        // 4. If we have API type results, add them as well
        if (connectionStatus.apiTestResults) {
          const { openApi, cloudApi, httpApi, developerApi } = connectionStatus.apiTestResults;
          
          if (openApi !== undefined) {
            newDiagnostics.push({
              name: 'Open API Connection',
              status: openApi ? 'success' : 'error',
              message: openApi ? 'Successfully connected to DJI Open API' : 'Failed to connect to DJI Open API',
              timestamp: new Date(),
              icon: <Globe className="mr-2 h-4 w-4" />
            });
          }
          
          if (cloudApi !== undefined) {
            newDiagnostics.push({
              name: 'Cloud API Connection',
              status: cloudApi ? 'success' : 'error',
              message: cloudApi ? 'Successfully connected to DJI Cloud API' : 'Failed to connect to DJI Cloud API',
              timestamp: new Date(),
              icon: <Globe className="mr-2 h-4 w-4" />
            });
          }
          
          if (httpApi !== undefined) {
            newDiagnostics.push({
              name: 'HTTP API Connection',
              status: httpApi ? 'success' : 'error',
              message: httpApi ? 'Successfully connected to DJI HTTP API' : 'Failed to connect to DJI HTTP API',
              timestamp: new Date(),
              icon: <Globe className="mr-2 h-4 w-4" />
            });
          }
          
          if (developerApi !== undefined) {
            newDiagnostics.push({
              name: 'Developer API Connection',
              status: developerApi ? 'success' : 'error',
              message: developerApi ? 'Successfully connected to DJI Developer API' : 'Failed to connect to DJI Developer API',
              timestamp: new Date(),
              icon: <Globe className="mr-2 h-4 w-4" />
            });
          }
        }
      } catch (apiError) {
        // Handle API connection test error
        newDiagnostics.push({
          name: 'API Authentication',
          status: 'error',
          message: 'Failed to authenticate with DJI servers',
          details: `Error: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`,
          timestamp: new Date(),
          icon: <Server className="mr-2 h-4 w-4" />
        });
      }

      // Calculate overall status based on all test results
      const statusPriority: Record<string, number> = { error: 0, warning: 1, pending: 2, success: 3 };
      const allStatuses = newDiagnostics.map(d => d.status);
      
      const worstStatus = allStatuses.reduce((worst, current) => {
        return statusPriority[current] < statusPriority[worst] ? current : worst;
      }, 'success' as 'success' | 'error' | 'warning' | 'pending');
      
      // Update state with all diagnostic results
      setDiagnostics(newDiagnostics);
      setOverallStatus(worstStatus);
    } catch (error) {
      console.error('Diagnostic test error:', error);
      setDiagnostics([{
        name: 'Diagnostic Failure',
        status: 'error',
        message: 'Failed to complete diagnostic tests',
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        icon: <XCircle className="mr-2 h-4 w-4" />
      }]);
      setOverallStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Run diagnostics on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  // Render status icon
  const renderStatusIcon = (status: 'success' | 'error' | 'warning' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  // Get overall status text and color
  const getStatusInfo = () => {
    switch (overallStatus) {
      case 'success':
        return { text: 'All systems operational', color: 'bg-green-100 text-green-800' };
      case 'warning':
        return { text: 'Some issues detected', color: 'bg-yellow-100 text-yellow-800' };
      case 'error':
        return { text: 'Critical issues detected', color: 'bg-red-100 text-red-800' };
      case 'pending':
        return { text: 'Diagnostics in progress', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>DJI API Diagnostics</CardTitle>
            <CardDescription>
              Troubleshoot your DJI API connection
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className={`p-4 rounded-md ${statusInfo.color} mb-4`}>
              <div className="flex items-center">
                {renderStatusIcon(overallStatus)}
                <span className="ml-2 font-semibold">{statusInfo.text}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Diagnostic Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Tests Run</div>
                    <div className="text-xl font-bold">{diagnostics.length}</div>
                  </div>
                  
                  <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Last Update</div>
                    <div className="text-sm font-medium">
                      {diagnostics.length > 0 
                        ? diagnostics[diagnostics.length - 1].timestamp.toLocaleTimeString() 
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Status Breakdown</h3>
                <div className="space-y-2">
                  {diagnostics.map((diag, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStatusIcon(diag.status)}
                        <span className="ml-2 text-sm">{diag.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              {diagnostics.map((diag, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      {renderStatusIcon(diag.status)}
                      <span className="ml-2">{diag.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-2 text-sm">
                      <p className="mb-2">{diag.message}</p>
                      {diag.details && <p className="text-muted-foreground text-xs">{diag.details}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        Tested at: {diag.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          
          <TabsContent value="troubleshooting" className="mt-4">
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Connection Issues Detected</AlertTitle>
                <AlertDescription>
                  Based on the diagnostics, we've detected issues connecting to the DJI API servers.
                  Below are some troubleshooting steps to help resolve these issues.
                </AlertDescription>
              </Alert>
              
              <div>
                <h3 className="font-medium mb-2">Common Solutions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Verify your DJI API credentials are correct and up to date</li>
                  <li>Check your internet connection and verify you can access the DJI website</li>
                  <li>Ensure you have a valid DJI developer account with appropriate permissions</li>
                  <li>If using a VPN or proxy, try disabling it temporarily</li>
                  <li>Verify your firewall is not blocking outbound connections to DJI servers</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Additional Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://developer.dji.com/document/guide-getting-started/overview.html" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      DJI Developer Documentation
                    </a>
                  </li>
                  <li>
                    <a href="https://developer.dji.com/user" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      DJI Developer Portal
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        Last diagnostic run: {diagnostics.length > 0 
          ? new Date(Math.max(...diagnostics.map(d => d.timestamp.getTime()))).toLocaleString() 
          : 'Never'}
      </CardFooter>
    </Card>
  );
};

export default DJINetworkDiagnostics;