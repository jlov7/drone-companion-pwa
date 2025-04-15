import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, X, AlertTriangle, RefreshCw, Wrench, Server } from 'lucide-react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function DJIApiDiagnostics() {
  const [envStatus, setEnvStatus] = useState<{
    loading: boolean;
    checked: boolean;
    allKeysAvailable: boolean;
    availableKeys: string[];
    missingKeys: string[];
    error?: string;
  }>({
    loading: false,
    checked: false,
    allKeysAvailable: false,
    availableKeys: [],
    missingKeys: [],
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    loading: boolean;
    checked: boolean;
    success: boolean;
    message: string;
    error?: string;
  }>({
    loading: false,
    checked: false,
    success: false,
    message: 'Not checked yet',
  });

  const [mockDataStatus, setMockDataStatus] = useState<{
    enabled: boolean;
    loading: boolean;
    checked: boolean;
    message: string;
    error?: string;
  }>({
    enabled: true, // Assuming mock data is enabled by default
    loading: false,
    checked: false,
    message: 'Not checked yet'
  });

  const checkEnvironmentVariables = async () => {
    setEnvStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.get('/api/dji/check-env');
      setEnvStatus({
        loading: false,
        checked: true,
        allKeysAvailable: response.data.allKeysAvailable,
        availableKeys: response.data.availableKeys,
        missingKeys: response.data.missingKeys,
      });
    } catch (error) {
      console.error('Failed to check DJI environment variables:', error);
      setEnvStatus(prev => ({
        ...prev,
        loading: false,
        checked: true,
        error: 'Failed to check environment variables'
      }));
    }
  };

  const checkApiConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.get('/api/dji/verify-connection');
      setConnectionStatus({
        loading: false,
        checked: true,
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      });
    } catch (error: any) {
      console.error('Failed to check DJI API connection:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setConnectionStatus({
        loading: false,
        checked: true,
        success: false,
        message: 'Connection failed',
        error: errorMessage
      });
    }
  };

  const checkMockData = async () => {
    setMockDataStatus(prev => ({ ...prev, loading: true }));
    try {
      // Try to fetch devices, which should return mock data if API fails
      const response = await axios.get('/api/dji/devices');
      const devices = response.data.devices || [];
      
      if (devices.length > 0) {
        // If we got devices, let's determine if they're mock or real
        // This is a guess - we might need server logging to confirm
        const isMockData = devices.some((d: { deviceId: string }) => d.deviceId.startsWith('mock-'));
        
        setMockDataStatus({
          enabled: true,
          loading: false,
          checked: true,
          message: isMockData 
            ? 'Mock data is being used successfully' 
            : 'Real DJI API data is being retrieved'
        });
      } else {
        setMockDataStatus({
          enabled: true,
          loading: false,
          checked: true,
          message: 'No devices returned, mock data might not be working correctly',
          error: 'Empty device list'
        });
      }
    } catch (error: any) {
      console.error('Failed to check mock data:', error);
      setMockDataStatus({
        enabled: true,
        loading: false,
        checked: true,
        message: 'Failed to retrieve data',
        error: error.response?.data?.error || error.message || 'Unknown error'
      });
    }
  };

  // Perform initial checks on component mount
  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">DJI API Diagnostics</CardTitle>
          <CardDescription>
            Troubleshoot problems with the DJI API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Variables Check */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Environment Variables</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkEnvironmentVariables}
                disabled={envStatus.loading}
              >
                {envStatus.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                {envStatus.checked ? 'Recheck' : 'Check'}
              </Button>
            </div>
            
            {envStatus.checked ? (
              <div className="mt-2">
                {envStatus.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{envStatus.error}</AlertDescription>
                  </Alert>
                ) : envStatus.allKeysAvailable ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">All API keys available</AlertTitle>
                    <AlertDescription className="text-green-600">
                      All required DJI API environment variables are set
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Missing API Keys</AlertTitle>
                    <AlertDescription>
                      <div>Some required DJI API environment variables are missing:</div>
                      <div className="mt-1">
                        {envStatus.missingKeys.map(key => (
                          <Badge key={key} variant="outline" className="mr-2 mb-1 bg-red-50 text-red-700 border-red-200">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="mt-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="variables">
                      <AccordionTrigger className="text-sm">
                        View all API keys status
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Available Keys:</div>
                          <div className="flex flex-wrap gap-2">
                            {envStatus.availableKeys.map(key => (
                              <Badge key={key} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {key} <Check className="ml-1 h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                          
                          {envStatus.missingKeys.length > 0 && (
                            <>
                              <div className="text-sm font-medium mt-2">Missing Keys:</div>
                              <div className="flex flex-wrap gap-2">
                                {envStatus.missingKeys.map(key => (
                                  <Badge key={key} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    {key} <X className="ml-1 h-3 w-3" />
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Click "Check" to verify environment variables</div>
            )}
          </div>

          {/* API Connection Check */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">API Connection</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkApiConnection}
                disabled={connectionStatus.loading}
              >
                {connectionStatus.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                {connectionStatus.checked ? 'Recheck' : 'Check'}
              </Button>
            </div>
            
            {connectionStatus.checked ? (
              <div className="mt-2">
                {connectionStatus.success ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Connection Successful</AlertTitle>
                    <AlertDescription className="text-green-600">
                      {connectionStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <Server className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription>
                      <div>{connectionStatus.message}</div>
                      {connectionStatus.error && (
                        <div className="mt-1 text-sm opacity-80">{connectionStatus.error}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">Click "Check" to test DJI API connection</div>
            )}
          </div>

          {/* Mock Data Check */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Fallback Data Status</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkMockData}
                disabled={mockDataStatus.loading}
              >
                {mockDataStatus.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mockDataStatus.checked ? 'Recheck' : 'Check'}
              </Button>
            </div>
            
            {mockDataStatus.checked ? (
              <div className="mt-2">
                {mockDataStatus.error ? (
                  <Alert variant="destructive">
                    <Wrench className="h-4 w-4" />
                    <AlertTitle>Issue with Demo Data</AlertTitle>
                    <AlertDescription>
                      <div>{mockDataStatus.message}</div>
                      <div className="mt-1 text-sm opacity-80">{mockDataStatus.error}</div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-amber-700">Demo Data Status</AlertTitle>
                    <AlertDescription className="text-amber-600">
                      {mockDataStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">Click "Check" to verify if demo data is available</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <div className="text-xs text-muted-foreground">
            These diagnostics help identify issues with the DJI API integration
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              checkEnvironmentVariables();
              checkApiConnection();
              checkMockData();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}