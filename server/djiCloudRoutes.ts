import { Router, Request, Response } from 'express';
import axios from 'axios';
import { IStorage } from './storage';
import { InsertDrone, InsertFlightLog, InsertBattery } from '@shared/schema';

// DJI API Configuration
const DJI_API_BASE_URL = 'https://api-uat.dji.com/api/v1'; // Using UAT/development endpoint
// Check if environment variables are set correctly
console.log('DJI API Key available:', Boolean(process.env.DJI_API_KEY));
console.log('DJI API Secret available:', Boolean(process.env.DJI_API_SECRET));
const DJI_API_KEY = process.env.DJI_API_KEY;
const DJI_API_SECRET = process.env.DJI_API_SECRET;

// DJI API Endpoints
const ENDPOINTS = {
  AUTH: '/auth/token',
  USER_PROFILE: '/user/profile',
  USER_DEVICES: '/devices',
  DEVICE_DETAILS: (deviceId: string) => `/devices/${deviceId}`,
  FLIGHT_RECORDS: '/flightRecords',
  FLIGHT_DETAILS: (recordId: string) => `/flightRecords/${recordId}`,
};

// Interface for DJI API Authentication Response
interface DJIAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Interface for DJI Device
interface DJIDevice {
  deviceId: string;
  deviceName: string;
  deviceSN: string;
  productType: string;
  productTypeDescription: string;
  productVersion: string;
  firmwareVersion: string;
  activated: boolean;
  activationTime?: number;
  lastFlightTime?: number;
}

// Interface for DJI Flight Record
interface DJIFlightRecord {
  recordId: string;
  deviceId: string;
  deviceSN: string;
  productType: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  distance: number; // in meters
  maxHeight: number; // in meters
  maxHorizontalSpeed: number; // in m/s
  maxVerticalSpeed: number; // in m/s
  photoCount: number;
  videoCount: number;
  hasSnapshot: boolean;
  hasCrashInfo: boolean;
  hasWaypoints: boolean;
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    timestamp: number;
  }>;
}

// DJI API session information
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Set up DJI Cloud API routes
export function setupDJICloudRoutes(app: Router, storage: IStorage) {
  
  // AUTHENTICATION FUNCTION
  async function getDJIAuthToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (accessToken && tokenExpiry > Date.now() + 60000) {
        return accessToken;
      }
      
      // Otherwise, get a new token
      const response = await axios.post<DJIAuthResponse>(
        `${DJI_API_BASE_URL}${ENDPOINTS.AUTH}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: DJI_API_KEY || '',
            password: DJI_API_SECRET || '',
          },
        }
      );
      
      if (response.data && response.data.accessToken) {
        accessToken = response.data.accessToken;
        tokenExpiry = Date.now() + (response.data.expiresIn * 1000);
        return accessToken;
      } else {
        throw new Error('Invalid response from DJI authentication service');
      }
    } catch (error) {
      console.error('Error authenticating with DJI API:', error);
      throw error;
    }
  }
  
  // Make authenticated requests to DJI API
  async function djiApiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params?: any
  ): Promise<T> {
    try {
      const token = await getDJIAuthToken();
      
      const response = await axios({
        method,
        url: `${DJI_API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined,
      });
      
      return response.data as T;
    } catch (error) {
      console.error(`DJI API request failed for ${endpoint}:`, error);
      throw error;
    }
  }
  
  // Endpoint to verify DJI API connectivity
  app.get('/api/dji/verify-connection', async (req: Request, res: Response) => {
    try {
      await getDJIAuthToken();
      res.json({ success: true, message: 'DJI Cloud API connection successful' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect to DJI Cloud API', 
        error: errorMessage
      });
    }
  });
  
  // Get all user's devices (drones)
  app.get('/api/dji/devices', async (req: Request, res: Response) => {
    try {
      const devices = await djiApiRequest<{ devices: DJIDevice[] }>(ENDPOINTS.USER_DEVICES);
      res.json(devices);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to fetch DJI devices', error: errorMessage });
    }
  });
  
  // Get details for a specific device
  app.get('/api/dji/devices/:deviceId', async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const device = await djiApiRequest<DJIDevice>(ENDPOINTS.DEVICE_DETAILS(deviceId));
      res.json(device);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to fetch DJI device details', error: errorMessage });
    }
  });
  
  // Get flight records for a device
  app.get('/api/dji/flight-records', async (req: Request, res: Response) => {
    try {
      const { deviceId, limit = 50 } = req.query;
      const flightRecords = await djiApiRequest<{ records: DJIFlightRecord[] }>(
        ENDPOINTS.FLIGHT_RECORDS,
        'GET',
        { deviceId, limit }
      );
      res.json(flightRecords);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to fetch DJI flight records', error: errorMessage });
    }
  });
  
  // Get details for a specific flight record
  app.get('/api/dji/flight-records/:recordId', async (req: Request, res: Response) => {
    try {
      const { recordId } = req.params;
      const flightRecord = await djiApiRequest<DJIFlightRecord>(ENDPOINTS.FLIGHT_DETAILS(recordId));
      res.json(flightRecord);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to fetch DJI flight record details', error: errorMessage });
    }
  });
  
  // Sync drones from DJI account to our database
  app.post('/api/dji/sync-drones', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Get devices from DJI API
      const devicesResponse = await djiApiRequest<{ devices: DJIDevice[] }>(ENDPOINTS.USER_DEVICES);
      const devices = devicesResponse.devices || [];
      
      if (devices.length === 0) {
        return res.json({ message: 'No DJI drones found to sync', drones: [] });
      }
      
      const syncedDrones = [];
      
      // Process each device
      for (const device of devices) {
        // Check if drone already exists in our system
        const existingDrones = await storage.getDronesByUserId(userId);
        const existingDrone = existingDrones.find(d => d.serialNumber === device.deviceSN);
        
        if (existingDrone) {
          // Update existing drone
          const updatedDrone = await storage.updateDrone(existingDrone.id, {
            name: device.deviceName || existingDrone.name,
            model: device.productTypeDescription,
            firmware: device.firmwareVersion,
            status: device.activated ? 'ready' : 'maintenance',
          });
          
          if (updatedDrone) {
            syncedDrones.push(updatedDrone);
          }
        } else {
          // Create new drone
          const newDrone: InsertDrone = {
            userId,
            name: device.deviceName || `DJI ${device.productTypeDescription}`,
            serialNumber: device.deviceSN,
            model: device.productTypeDescription,
            firmware: device.firmwareVersion,
            status: device.activated ? 'ready' : 'maintenance',
            batteryPercent: null,
            storageUsed: null,
            storageTotal: null,
            notes: `Imported from DJI Cloud API on ${new Date().toLocaleDateString()}`,
          };
          
          const createdDrone = await storage.createDrone(newDrone);
          syncedDrones.push(createdDrone);
          
          // Create default battery for the drone
          const newBattery: InsertBattery = {
            userId,
            droneId: createdDrone.id,
            name: 'Primary Battery',
            serialNumber: `${device.deviceSN}-BAT1`,
            chargeCycles: 0,
            maxChargeCycles: 300, // Default for most DJI batteries
            health: 100,
            status: 'healthy',
            estimatedFlightTime: 25, // Default estimate in minutes
          };
          
          await storage.createBattery(newBattery);
        }
      }
      
      res.json({
        message: `Successfully synced ${syncedDrones.length} drones from DJI account`,
        drones: syncedDrones
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to sync DJI drones', error: errorMessage });
    }
  });
  
  // Sync flight logs for a specific drone
  app.post('/api/dji/sync-flight-logs', async (req: Request, res: Response) => {
    try {
      const { userId, droneId } = req.body;
      
      if (!userId || !droneId) {
        return res.status(400).json({ message: 'User ID and Drone ID are required' });
      }
      
      // Get the drone from our database
      const drone = await storage.getDrone(droneId);
      
      if (!drone) {
        return res.status(404).json({ message: 'Drone not found' });
      }
      
      // Get flight records from DJI API
      const flightRecordsResponse = await djiApiRequest<{ records: DJIFlightRecord[] }>(
        ENDPOINTS.FLIGHT_RECORDS,
        'GET',
        { deviceId: drone.serialNumber, limit: 20 } // Last 20 flights
      );
      
      const flightRecords = flightRecordsResponse.records || [];
      
      if (flightRecords.length === 0) {
        return res.json({ message: 'No flight records found for this drone', flights: [] });
      }
      
      const syncedFlights = [];
      let totalFlightTimeHours = 0;
      
      // Process each flight record
      for (const record of flightRecords) {
        // Get existing flight logs to check for duplicates
        const existingLogs = await storage.getFlightLogsByDroneId(droneId);
        const isDuplicate = existingLogs.some(log => 
          log.notes?.includes(record.recordId) || 
          (log.startTime && new Date(log.startTime).getTime() === record.startTime)
        );
        
        if (!isDuplicate) {
          // Create new flight log
          const flightLog: InsertFlightLog = {
            userId,
            droneId,
            location: record.hasWaypoints ? 'DJI Waypoint Mission' : 'DJI Flight',
            distance: record.distance / 1000, // Convert to km
            duration: record.duration, // In seconds
            maxAltitude: record.maxHeight,
            maxSpeed: record.maxHorizontalSpeed,
            weatherConditions: 'Unknown', // DJI API doesn't provide weather data
            startTime: new Date(record.startTime),
            endTime: new Date(record.endTime),
            batteryStart: 100, // Estimated since DJI API doesn't provide this
            batteryEnd: 30, // Estimated
            notes: `Imported from DJI Cloud API - Flight ID: ${record.recordId}`,
            isCompleted: true
          };
          
          const createdLog = await storage.createFlightLog(flightLog);
          syncedFlights.push(createdLog);
          
          // Add to total flight time (in hours)
          totalFlightTimeHours += record.duration / 3600;
        }
      }
      
      // Update drone's total flight time and last flight ID
      if (syncedFlights.length > 0) {
        const lastFlightId = syncedFlights[0].id; // Most recent flight
        const currentFlightTime = drone.flightTime || 0;
        
        await storage.updateDrone(droneId, {
          flightTime: currentFlightTime + totalFlightTimeHours,
          lastFlightId,
        });
      }
      
      res.json({
        message: `Successfully synced ${syncedFlights.length} flight logs from DJI account`,
        flights: syncedFlights
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to sync DJI flight logs', error: errorMessage });
    }
  });
  
  return app;
}