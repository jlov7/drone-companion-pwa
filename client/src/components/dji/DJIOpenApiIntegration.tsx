import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, RefreshCw, Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DJIOpenApiIntegrationProps {
  userId: number;
  onSuccess?: (data: any) => void;
}

export function DJIOpenApiIntegration({ 
  userId,
  onSuccess 
}: DJIOpenApiIntegrationProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [isSyncingDrones, setIsSyncingDrones] = useState(false);
  const [syncedDrones, setSyncedDrones] = useState<any[]>([]);
  const [droneError, setDroneError] = useState<string | null>(null);
  
  const [isSyncingFlights, setIsSyncingFlights] = useState(false);
  const [syncedFlights, setSyncedFlights] = useState<any[]>([]);
  const [flightError, setFlightError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('connection');
  
  // Verify connection to DJI Open API
  const verifyConnection = async () => {
    setIsVerifying(true);
    setConnectionError(null);
    try {
      const response = await axios.get('/api/dji/verify-connection');
      
      setIsConnected(response.data.success);
      
      if (response.data.success) {
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to DJI Open API',
        });
        
        // Auto-advance to next tab
        setActiveTab('sync');
      } else {
        setConnectionError(response.data.error || 'Failed to connect to DJI servers');
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: response.data.error || 'Failed to connect to DJI servers',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setIsConnected(false);
      setConnectionError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Sync drones from DJI API
  const syncDrones = async () => {
    setIsSyncingDrones(true);
    setDroneError(null);
    
    try {
      const response = await axios.post('/api/dji/sync-drones', { userId });
      
      if (response.data.drones && response.data.drones.length > 0) {
        setSyncedDrones(response.data.drones);
        
        toast({
          title: 'Drones Synced',
          description: `Successfully synced ${response.data.drones.length} drones`,
        });
        
        // Auto-advance to next tab
        setActiveTab('flights');
        
        if (onSuccess) {
          onSuccess({
            synced: true,
            drones: response.data.drones,
            message: response.data.message,
          });
        }
      } else {
        setDroneError('No drones found to sync');
        
        toast({
          variant: 'destructive',
          title: 'Sync Failed',
          description: 'No drones found in your DJI account',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setDroneError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: errorMessage,
      });
    } finally {
      setIsSyncingDrones(false);
    }
  };
  
  // Sync flight logs for all drones
  const syncFlightLogs = async () => {
    if (syncedDrones.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Drones Available',
        description: 'Please sync drones first before syncing flight logs',
      });
      return;
    }
    
    setIsSyncingFlights(true);
    setFlightError(null);
    setSyncedFlights([]);
    
    try {
      const allFlights = [];
      
      // Sync flights for each drone
      for (const drone of syncedDrones) {
        try {
          const response = await axios.post('/api/dji/sync-flight-logs', { 
            userId, 
            droneId: drone.id 
          });
          
          if (response.data.flights && response.data.flights.length > 0) {
            allFlights.push(...response.data.flights);
          }
        } catch (droneError) {
          console.error(`Error syncing flights for drone ${drone.id}:`, droneError);
          // Continue with next drone
        }
      }
      
      if (allFlights.length > 0) {
        setSyncedFlights(allFlights);
        
        toast({
          title: 'Flight Logs Synced',
          description: `Successfully synced ${allFlights.length} flight logs`,
        });
        
        if (onSuccess) {
          onSuccess({
            synced: true,
            flights: allFlights,
            message: `Synced ${allFlights.length} flight logs`,
          });
        }
      } else {
        setFlightError('No flight logs found for your drones');
        
        toast({
          variant: 'destructive',
          title: 'No Flight Logs',
          description: 'No flight logs found for your DJI drones',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setFlightError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: errorMessage,
      });
    } finally {
      setIsSyncingFlights(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">DJI Open API Integration</AlertTitle>
        <AlertDescription className="text-blue-600">
          Connect to DJI servers and sync your drones and flight logs
        </AlertDescription>
      </Alert>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="connection">1. Connection</TabsTrigger>
          <TabsTrigger value="sync" disabled={!isConnected && !connectionError}>2. Sync Drones</TabsTrigger>
          <TabsTrigger value="flights" disabled={syncedDrones.length === 0}>3. Flight Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="mt-0">
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {isConnected ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Connected to DJI</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Successfully connected to DJI Open API
                    </AlertDescription>
                  </Alert>
                ) : connectionError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription>
                      {connectionError}
                      <div className="mt-2 text-sm opacity-90">
                        <p>Don't worry - we can still use local demo data to show you the app features.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Connection Required</AlertTitle>
                    <AlertDescription>
                      Click the verify button to connect to DJI servers
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-center">
                  <Button 
                    variant="default"
                    onClick={verifyConnection} 
                    disabled={isVerifying}
                    className="px-6"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : isConnected ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verify Connection
                      </>
                    )}
                  </Button>
                </div>
                
                {!isConnected && connectionError && (
                  <div className="text-sm text-center mt-3 text-muted-foreground">
                    Click "Next" to continue with demo data
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('sync')}
                    disabled={!isConnected && !connectionError}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync" className="mt-0">
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {syncedDrones.length > 0 ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Drones Synced</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Successfully synced {syncedDrones.length} drones
                    </AlertDescription>
                  </Alert>
                ) : droneError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Sync Failed</AlertTitle>
                    <AlertDescription>
                      {droneError}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Sync Required</AlertTitle>
                    <AlertDescription>
                      Click the sync button to retrieve your DJI drones
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-center">
                  <Button 
                    variant="default"
                    onClick={syncDrones} 
                    disabled={isSyncingDrones}
                    className="px-6"
                  >
                    {isSyncingDrones ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : syncedDrones.length > 0 ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Synced {syncedDrones.length} Drones
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Drones
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('connection')}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('flights')}
                    disabled={syncedDrones.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flights" className="mt-0">
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {syncedFlights.length > 0 ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Flight Logs Synced</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Successfully synced {syncedFlights.length} flight logs
                    </AlertDescription>
                  </Alert>
                ) : flightError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Sync Failed</AlertTitle>
                    <AlertDescription>
                      {flightError}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Sync Required</AlertTitle>
                    <AlertDescription>
                      Click the sync button to retrieve flight logs for your drones
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-center">
                  <Button 
                    variant="default"
                    onClick={syncFlightLogs} 
                    disabled={isSyncingFlights}
                    className="px-6"
                  >
                    {isSyncingFlights ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : syncedFlights.length > 0 ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Synced {syncedFlights.length} Logs
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Flight Logs
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-start mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('sync')}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}