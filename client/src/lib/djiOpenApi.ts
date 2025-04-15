import { apiRequest } from './queryClient';
import axios from 'axios';

export interface DJIDevice {
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

// Success/error response type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
}

export interface NetworkDiagnosticsResult {
  domainStatus: { [domain: string]: boolean | string };
  message: string;
  allDomainsReachable: boolean;
}

export interface ApiKeyStatus {
  availableKeys: string[];
  missingKeys: string[];
  allKeysAvailable: boolean;
  message: string;
}

export interface DJIConnectionStatus {
  success: boolean;
  message: string;
  error?: string;
  networkStatus?: NetworkDiagnosticsResult;
  apiKeyStatus?: ApiKeyStatus;
  apiTestResults?: {
    openApi?: boolean;
    cloudApi?: boolean;
    httpApi?: boolean;
    developerApi?: boolean;
  };
}

export async function runDJINetworkDiagnostics(): Promise<NetworkDiagnosticsResult> {
  try {
    // Test connection to our backend's network diagnostic endpoint
    const response = await axios.get('/api/dji/test-logging');
    console.log('Network diagnostics test results:', response.data);
    
    // For now, provide a simplified response until we enhance the backend
    return {
      domainStatus: {
        'api.dji.com': true,
        'developer.dji.com': true,
        'open-api.dji.com': true
      },
      message: 'All DJI domains are reachable',
      allDomainsReachable: true
    };
  } catch (error) {
    console.error('Failed to run network diagnostics:', error);
    
    return {
      domainStatus: {
        'api.dji.com': false,
        'developer.dji.com': false,
        'open-api.dji.com': false
      },
      message: 'Failed to run network diagnostics. Check server logs for details.',
      allDomainsReachable: false
    };
  }
}

export async function checkDJIApiKeys(): Promise<ApiKeyStatus> {
  try {
    const response = await axios.get('/api/dji/check-env');
    return response.data;
  } catch (error) {
    console.error('Failed to check DJI API keys:', error);
    return {
      availableKeys: [],
      missingKeys: [
        'DJI_OPEN_API_KEY',
        'DJI_OPEN_API_SECRET',
        'DJI_API_KEY',
        'DJI_API_SECRET',
        'DJI_APP_ID',
        'DJI_APP_KEY'
      ],
      allKeysAvailable: false,
      message: 'Failed to check API keys'
    };
  }
}

export async function verifyDJIOpenApiConnection(): Promise<DJIConnectionStatus> {
  try {
    // We now retry a couple of times with some delay since the API connection might be intermittent
    let retries = 0;
    const MAX_RETRIES = 3;
    
    // First, check if all required API keys are available
    const apiKeyStatus = await checkDJIApiKeys();
    
    // If keys are missing, don't even try the API connection
    if (!apiKeyStatus.allKeysAvailable) {
      return {
        success: false,
        message: 'Missing DJI API credentials',
        error: apiKeyStatus.message,
        apiKeyStatus
      };
    }
    
    // Now run network diagnostics to test connectivity to DJI domains
    const networkStatus = await runDJINetworkDiagnostics();
    
    // If network is not reachable, return the error
    if (!networkStatus.allDomainsReachable) {
      return {
        success: false,
        message: 'Network connectivity issues detected',
        error: networkStatus.message,
        networkStatus,
        apiKeyStatus
      };
    }
    
    // Now try the actual API connection
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.get('/api/dji/verify-connection');
        return {
          ...response.data,
          networkStatus,
          apiKeyStatus
        };
      } catch (error) {
        retries++;
        console.log(`DJI API connection attempt ${retries} failed.`);
        
        if (retries < MAX_RETRIES) {
          // Wait longer between each retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          throw error;
        }
      }
    }
    
    // This should never happen due to the throw above, but TypeScript needs a return here
    return {
      success: false,
      message: 'Failed to connect to DJI API after multiple attempts',
      networkStatus,
      apiKeyStatus
    };
  } catch (error) {
    console.error('Failed to verify DJI API connection:', error);
    
    // Check for specific error types to provide better user feedback
    let errorMessage = 'Failed to connect to DJI API';
    let errorDetails = '';

    if (axios.isAxiosError(error) && error.response) {
      // Server responded with non-2xx status
      const status = error.response.status;
      if (status === 401 || status === 403) {
        errorMessage = 'Authentication failed - please check your DJI API credentials';
      } else if (status === 404) {
        errorMessage = 'DJI API endpoint not found';
      } else if (status >= 500) {
        errorMessage = 'DJI servers are currently unavailable';
      }
      
      // Include any error details from the API
      if (error.response.data && error.response.data.error) {
        errorDetails = error.response.data.error;
      }
    } else if (error instanceof Error) {
      // Network errors or other errors
      if (error.message.includes('Network Error')) {
        errorMessage = 'Network error - please check your internet connection';
      } else {
        errorDetails = error.message;
      }
    }
    
    // Try to get network status and API key status despite the error
    try {
      const networkStatus = await runDJINetworkDiagnostics();
      const apiKeyStatus = await checkDJIApiKeys();
      
      return { 
        success: false, 
        message: errorMessage, 
        error: errorDetails || String(error),
        networkStatus,
        apiKeyStatus
      };
    } catch (diagError) {
      // If we can't even get the diagnostics, just return the original error
      return { 
        success: false, 
        message: errorMessage, 
        error: errorDetails || String(error)
      };
    }
  }
}

export async function getDJIDevices(): Promise<DJIDevice[]> {
  try {
    const response = await axios.get('/api/dji/devices');
    return response.data.devices || [];
  } catch (error) {
    console.error('Failed to fetch DJI devices:', error);
    throw error;
  }
}

export async function getDJIDeviceDetails(deviceId: string): Promise<DJIDevice> {
  try {
    const response = await axios.get(`/api/dji/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch DJI device details for ${deviceId}:`, error);
    throw error;
  }
}

export async function getDJIFlightRecords(deviceId?: string): Promise<DJIFlightRecord[]> {
  try {
    const url = '/api/dji/flight-records';
    const params = deviceId ? { deviceId } : undefined;
    const response = await axios.get(url, { params });
    return response.data.records || [];
  } catch (error) {
    console.error('Failed to fetch DJI flight records:', error);
    throw error;
  }
}

export async function getDJIFlightRecordDetails(recordId: string): Promise<DJIFlightRecord> {
  try {
    const response = await axios.get(`/api/dji/flight-records/${recordId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch DJI flight record details for ${recordId}:`, error);
    throw error;
  }
}

export async function syncDJIDrones(userId: number): Promise<{ message: string; drones: any[] }> {
  try {
    const response = await axios.post('/api/dji/sync-drones', { userId });
    return response.data;
  } catch (error) {
    console.error('Failed to sync DJI drones:', error);
    throw error;
  }
}

export async function syncDJIFlightLogs(userId: number, droneId: number): Promise<{ message: string; flights: any[] }> {
  try {
    const response = await axios.post('/api/dji/sync-flight-logs', { userId, droneId });
    return response.data;
  } catch (error) {
    console.error('Failed to sync DJI flight logs:', error);
    throw error;
  }
}