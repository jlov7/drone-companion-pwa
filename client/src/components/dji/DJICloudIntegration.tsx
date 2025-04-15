import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CloudCog, Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { queryClient } from '@/lib/queryClient';

interface DJICloudIntegrationProps {
  userId: number;
  onSuccess?: (data: any) => void;
}

// Sample drone data for demonstration when API is not accessible
const SAMPLE_DJI_DRONES = [
  {
    id: 101,
    name: "DJI Mavic 3 Pro",
    serialNumber: "1ASDK32343423",
    model: "Mavic 3 Pro",
    firmware: "v01.00.0500",
    status: "ready",
    batteryPercent: 92,
    storageUsed: 18,
    storageTotal: 64
  },
  {
    id: 102,
    name: "DJI Mini 3 Pro",
    serialNumber: "1BZXP82773984",
    model: "Mini 3 Pro",
    firmware: "v01.00.0400",
    status: "ready",
    batteryPercent: 87,
    storageUsed: 12,
    storageTotal: 32
  }
];

export function DJICloudIntegration({ userId, onSuccess }: DJICloudIntegrationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    drones: number;
    flights: number;
  }>({ drones: 0, flights: 0 });
  
  const { toast } = useToast();
  
  // Verify DJI Cloud API connection
  const verifyConnection = async () => {
    setIsVerifying(true);
    setError('');
    
    // If we're in demo mode, simulate a successful connection
    if (isDemoMode) {
      setTimeout(() => {
        setIsConnected(true);
        setIsVerifying(false);
        toast({
          title: 'Demo Mode Active',
          description: 'Connected to simulated DJI Cloud API',
        });
      }, 1500);
      return;
    }
    
    try {
      const response = await axios.get('/api/dji/verify-connection');
      
      if (response.data.success) {
        setIsConnected(true);
        toast({
          title: 'DJI Cloud Connected',
          description: 'Successfully connected to DJI Cloud API',
        });
      } else {
        throw new Error(response.data.message || 'Failed to connect to DJI Cloud');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to DJI Cloud';
      setError(errorMessage);
      setIsConnected(false);
      
      // If API is not available, offer demo mode
      if (errorMessage.includes('ENOTFOUND')) {
        setIsDemoMode(true);
        setError('DJI Cloud API is not available in this environment. Using demonstration mode.');
      } else {
        toast({
          title: 'Connection Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Try to connect to DJI API on component mount
  useEffect(() => {
    // Try to verify the connection when component mounts
    const connectOnMount = async () => {
      await verifyConnection();
    };
    connectOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync drones from DJI Cloud
  const syncDrones = async () => {
    if (!isConnected) {
      await verifyConnection();
      if (!isConnected && !isDemoMode) return;
    }
    
    setIsSyncing(true);
    setSyncProgress(10);
    setError('');
    
    // If we're in demo mode, simulate drone syncing
    if (isDemoMode) {
      simulateDroneSync();
      return;
    }
    
    try {
      // Sync drones from DJI Cloud
      const dronesResponse = await axios.post('/api/dji/sync-drones', { userId });
      
      if (dronesResponse.data.drones.length === 0) {
        setSyncProgress(100);
        setSyncStats({ drones: 0, flights: 0 });
        
        toast({
          title: 'No Drones Found',
          description: 'No DJI drones were found in your account to sync',
        });
        
        setIsSyncing(false);
        return;
      }
      
      setSyncProgress(50);
      setSyncStats(prev => ({ ...prev, drones: dronesResponse.data.drones.length }));
      
      // For each drone, sync flight logs
      let totalFlights = 0;
      
      for (const drone of dronesResponse.data.drones) {
        const flightsResponse = await axios.post('/api/dji/sync-flight-logs', {
          userId,
          droneId: drone.id,
        });
        
        totalFlights += flightsResponse.data.flights?.length || 0;
      }
      
      setSyncProgress(100);
      setSyncStats({ drones: dronesResponse.data.drones.length, flights: totalFlights });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/drones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flight-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batteries'] });
      
      toast({
        title: 'Sync Complete',
        description: `Synced ${dronesResponse.data.drones.length} drones and ${totalFlights} flight logs`,
      });
      
      if (onSuccess) {
        onSuccess({
          drones: dronesResponse.data.drones,
          flights: totalFlights,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync DJI data';
      setError(errorMessage);
      
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Simulate drone syncing for demo mode
  const simulateDroneSync = () => {
    // Simulate API delay
    setTimeout(() => {
      setSyncProgress(30);
      
      setTimeout(() => {
        setSyncProgress(60);
        
        setTimeout(() => {
          // Create sample drones in our database
          const createSampleDrones = async () => {
            try {
              // For each sample drone, create in database
              let totalDrones = 0;
              let totalFlights = 0;
              
              for (const drone of SAMPLE_DJI_DRONES) {
                // Create the drone
                const droneResponse = await axios.post('/api/drones', {
                  userId,
                  name: drone.name,
                  serialNumber: drone.serialNumber,
                  model: drone.model,
                  firmware: drone.firmware,
                  status: drone.status,
                  batteryPercent: drone.batteryPercent,
                  storageUsed: drone.storageUsed,
                  storageTotal: drone.storageTotal,
                  notes: 'Imported from DJI Cloud API (Demo)'
                });
                
                totalDrones++;
                
                if (droneResponse.data && droneResponse.data.id) {
                  // Create a flight log for each drone
                  const currentDate = new Date();
                  const startTime = new Date(currentDate);
                  startTime.setHours(startTime.getHours() - 2);
                  
                  await axios.post('/api/flight-logs', {
                    userId,
                    droneId: droneResponse.data.id, // Use the actual drone ID from the response
                    location: 'Demo Flight',
                    startTime,
                    endTime: currentDate,
                    duration: 3600, // 1 hour flight
                    distance: 5.2,
                    maxAltitude: 120,
                    maxSpeed: 32,
                    batteryStart: 98,
                    batteryEnd: drone.batteryPercent,
                    weatherConditions: 'Clear',
                    notes: 'Demo flight log created from DJI Cloud sync',
                    isCompleted: true
                  });
                  
                  // Create a battery for the drone too
                  await axios.post('/api/batteries', {
                    userId,
                    droneId: droneResponse.data.id,
                    name: 'Primary Battery',
                    serialNumber: `${drone.serialNumber}-BAT1`,
                    chargeCycles: 10,
                    maxChargeCycles: 300,
                    health: 98,
                    status: 'healthy',
                    estimatedFlightTime: 25
                  });
                }
                
                totalFlights++;
              }
              
              setSyncProgress(100);
              setSyncStats({ 
                drones: totalDrones, 
                flights: totalFlights 
              });
              
              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['/api/drones'] });
              queryClient.invalidateQueries({ queryKey: ['/api/flight-logs'] });
              
              toast({
                title: 'Demo Sync Complete',
                description: `Synced ${totalDrones} drones and ${totalFlights} flight logs from DJI Cloud (Demo)`,
              });
              
              if (onSuccess) {
                onSuccess({
                  drones: totalDrones,
                  flights: totalFlights,
                });
              }
              
              setIsSyncing(false);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to create demo data';
              setError(errorMessage);
              setIsSyncing(false);
              
              toast({
                title: 'Demo Sync Failed',
                description: errorMessage,
                variant: 'destructive',
              });
            }
          };
          
          createSampleDrones();
        }, 1000);
      }, 1000);
    }, 1000);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudCog className="h-5 w-5" />
          DJI Cloud Integration {isDemoMode && "(Demo Mode)"}
        </CardTitle>
        <CardDescription>
          Connect to DJI Cloud API to automatically sync your drones and flight logs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Demo Mode Alert */}
        {isDemoMode && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Demo Mode Active</AlertTitle>
            <AlertDescription>
              DJI Cloud API is not available in this environment. Using demonstration mode with sample data.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-3">
            {isConnected || isDemoMode ? (
              <Cloud className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">DJI Cloud Status</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : isDemoMode ? 'Connected (Demo)' : 'Not connected'}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={verifyConnection}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Verify Connection'
            )}
          </Button>
        </div>
        
        {/* Error message */}
        {error && !isDemoMode && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Sync options */}
        {(isConnected || isDemoMode) && (
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Sync Options</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Sync your DJI drones and flight logs from DJI Cloud to DroneLogger
              </p>
              
              {isSyncing && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span>Syncing data...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}
              
              {syncProgress === 100 && !isSyncing && (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Successfully synced {syncStats.drones} drones and {syncStats.flights} flight logs
                  </span>
                </div>
              )}
              
              <Button 
                onClick={syncDrones}
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  isDemoMode ? 'Sync Demo Data' : 'Sync DJI Cloud Data'
                )}
              </Button>
            </div>
            
            <div className="text-sm space-y-2">
              <h4 className="font-medium">About DJI Cloud Integration:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Your DJI account credentials are never stored on our servers</li>
                <li>We only access data you explicitly sync through the DJI Cloud API</li>
                <li>Flight logs, drone details, and battery information will be imported</li>
                <li>You can use this feature to automatically update your drone's statistics</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {!isConnected && !isDemoMode && (
          <Button onClick={verifyConnection} disabled={isVerifying}>
            Connect to DJI Cloud
          </Button>
        )}
        {isDemoMode && !isConnected && (
          <Button onClick={() => setIsConnected(true)} variant="outline">
            Use Demo Mode
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}