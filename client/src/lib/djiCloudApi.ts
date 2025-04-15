import axios from 'axios';
import { queryClient } from './queryClient';

// DJI Cloud API Base URL
const DJI_API_BASE_URL = 'https://api.dji.com/api/v1';

// API endpoints
const ENDPOINTS = {
  AUTH: '/auth/token',
  USER_PROFILE: '/user/profile',
  USER_DEVICES: '/devices',
  DEVICE_DETAILS: (deviceId: string) => `/devices/${deviceId}`,
  FLIGHT_RECORDS: '/flightRecords',
  FLIGHT_DETAILS: (recordId: string) => `/flightRecords/${recordId}`,
  MEDIA_LIST: '/media/list',
  MEDIA_DOWNLOAD: (mediaId: string) => `/media/${mediaId}/download`,
};

// Interface definitions
interface DJIAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  expiresAt?: number; // When the token expires (calculated)
}

export interface DJIUserProfile {
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export interface DJIDrone {
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

export interface DJIFlightRecord {
  recordId: string;
  deviceId: string;
  deviceSN: string;
  productType: string;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  maxHeight: number;
  maxHorizontalSpeed: number;
  maxVerticalSpeed: number;
  photoCount: number;
  videoCount: number;
  hasSnapshot: boolean;
  hasCrashInfo: boolean;
  hasWaypoints: boolean;
  waypoints?: DJIWaypoint[];
}

export interface DJIWaypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  timestamp: number;
}

export interface DJIMedia {
  mediaId: string;
  deviceId: string;
  deviceSN: string;
  productType: string;
  fileSize: number;
  fileType: string;
  createTime: number;
  updateTime: number;
  duration?: number;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

// Token management
let authTokens: DJIAuthTokens | null = null;

// Initialize the API with authentication
export async function initDJIApi(): Promise<boolean> {
  try {
    if (!process.env.DJI_API_KEY || !process.env.DJI_API_SECRET) {
      console.error('DJI API credentials are not configured');
      return false;
    }
    
    await refreshAuthToken();
    return true;
  } catch (error) {
    console.error('Failed to initialize DJI API:', error);
    return false;
  }
}

// Get the user's auth token
async function refreshAuthToken(): Promise<void> {
  try {
    const response = await axios.post(
      `${DJI_API_BASE_URL}${ENDPOINTS.AUTH}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.DJI_API_KEY || '',
          password: process.env.DJI_API_SECRET || '',
        },
      }
    );

    if (response.data && response.data.accessToken) {
      authTokens = {
        ...response.data,
        expiresAt: Date.now() + (response.data.expiresIn * 1000),
      };
    } else {
      throw new Error('Invalid response from DJI authentication service');
    }
  } catch (error) {
    console.error('Error obtaining DJI auth token:', error);
    authTokens = null;
    throw error;
  }
}

// Check if token is expired and refresh if needed
async function ensureValidToken(): Promise<string> {
  if (!authTokens) {
    await refreshAuthToken();
  } else if (authTokens.expiresAt && authTokens.expiresAt <= Date.now() + 60000) {
    // Refresh if token expires in less than a minute
    await refreshAuthToken();
  }
  
  if (!authTokens || !authTokens.accessToken) {
    throw new Error('Failed to obtain valid DJI authentication token');
  }
  
  return authTokens.accessToken;
}

// Make authenticated API requests
async function djiApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> {
  try {
    const token = await ensureValidToken();
    
    const response = await axios({
      method,
      url: `${DJI_API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' && data ? data : undefined,
    });
    
    return response.data as T;
  } catch (error) {
    console.error(`DJI API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// API Functions

// Get user profile
export async function getUserProfile(): Promise<DJIUserProfile> {
  return djiApiRequest<DJIUserProfile>(ENDPOINTS.USER_PROFILE);
}

// Get user's devices (drones)
export async function getUserDevices(): Promise<DJIDrone[]> {
  return djiApiRequest<DJIDrone[]>(ENDPOINTS.USER_DEVICES);
}

// Get details for a specific device
export async function getDeviceDetails(deviceId: string): Promise<DJIDrone> {
  return djiApiRequest<DJIDrone>(ENDPOINTS.DEVICE_DETAILS(deviceId));
}

// Get flight records
export async function getFlightRecords(params?: { 
  deviceId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}): Promise<DJIFlightRecord[]> {
  return djiApiRequest<DJIFlightRecord[]>(ENDPOINTS.FLIGHT_RECORDS, 'GET', params);
}

// Get flight record details
export async function getFlightDetails(recordId: string): Promise<DJIFlightRecord> {
  return djiApiRequest<DJIFlightRecord>(ENDPOINTS.FLIGHT_DETAILS(recordId));
}

// Get media list
export async function getMediaList(params?: {
  deviceId?: string;
  startTime?: number;
  endTime?: number;
  fileType?: string; // 'photo', 'video'
  limit?: number;
  offset?: number;
}): Promise<DJIMedia[]> {
  return djiApiRequest<DJIMedia[]>(ENDPOINTS.MEDIA_LIST, 'GET', params);
}

// Get media download URL
export async function getMediaDownloadUrl(mediaId: string): Promise<string> {
  const response = await djiApiRequest<{url: string}>(ENDPOINTS.MEDIA_DOWNLOAD(mediaId));
  return response.url;
}

// Sync functions (for app integration)

// Sync user drones from DJI Cloud
export async function syncDrones(userId: number): Promise<void> {
  try {
    const devices = await getUserDevices();
    
    // Process each drone
    for (const device of devices) {
      // Convert DJI drone format to our app format
      const droneData = {
        userId,
        name: device.deviceName || `DJI ${device.productTypeDescription}`,
        serialNumber: device.deviceSN,
        model: device.productTypeDescription,
        firmware: device.firmwareVersion,
        status: device.activated ? 'ready' : 'maintenance',
        flightTime: 0, // Will be updated with flight logs
        lastFlightId: null,
        batteryPercent: null,
        storageUsed: null,
        storageTotal: null,
        notes: `Imported from DJI Cloud API on ${new Date().toLocaleDateString()}`,
      };
      
      // Save to our system via API
      await axios.post('/api/drones/sync', droneData);
    }
    
    // Invalidate drone cache to refresh UI
    queryClient.invalidateQueries({ queryKey: ['/api/drones'] });
  } catch (error) {
    console.error('Failed to sync drones from DJI Cloud:', error);
    throw error;
  }
}

// Sync flight logs from DJI Cloud
export async function syncFlightLogs(userId: number, droneId: number, droneSN: string): Promise<void> {
  try {
    // Get flight records for this drone
    const flightRecords = await getFlightRecords({
      deviceId: droneSN,
      limit: 50, // Last 50 flights
    });
    
    // Process each flight record
    for (const record of flightRecords) {
      // Get detailed flight info
      const flightDetails = await getFlightDetails(record.recordId);
      
      // Format for our system
      const flightLog = {
        userId,
        droneId,
        location: 'DJI Cloud Flight',
        distance: record.distance / 1000, // Convert to km
        duration: record.duration, // In seconds
        maxAltitude: record.maxHeight,
        maxSpeed: record.maxHorizontalSpeed,
        startTime: new Date(record.startTime),
        endTime: new Date(record.endTime),
        batteryStart: 100, // Estimated
        batteryEnd: 20, // Estimated
        weatherConditions: 'Unknown',
        notes: `Imported from DJI Cloud API - Flight ID: ${record.recordId}`,
        isCompleted: true,
      };
      
      // Save to our API
      await axios.post('/api/flight-logs/sync', flightLog);
    }
    
    // Update drone's last flight time
    if (flightRecords.length > 0) {
      const latestFlight = flightRecords[0];
      await axios.patch(`/api/drones/${droneId}`, {
        lastFlightTime: new Date(latestFlight.endTime),
      });
    }
    
    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ['/api/flight-logs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/drones'] });
  } catch (error) {
    console.error('Failed to sync flight logs from DJI Cloud:', error);
    throw error;
  }
}

// Initialize the API
initDJIApi().catch(err => {
  console.error('DJI Cloud API initialization failed:', err);
});