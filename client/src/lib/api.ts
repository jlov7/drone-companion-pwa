import { db } from './db';
import { queryClient } from './queryClient';

// Queue operation for sync when offline
async function queueForSync(type: string, data: any): Promise<void> {
  await db.addToSyncQueue(type, data);
  
  // Try to register a background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// Check if browser is online
function isOnline(): boolean {
  return navigator.onLine;
}

// Handle API requests with offline support
async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown,
  offlineAction?: (data: any) => Promise<any>
): Promise<T> {
  // Try online request first
  if (isOnline()) {
    try {
      const response = await fetch(url, {
        method,
        headers: data ? { 'Content-Type': 'application/json' } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text() || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // If network error, fall back to offline mode
      console.error('Network request failed, falling back to offline mode:', error);
    }
  }
  
  // Handle offline case
  if (offlineAction) {
    const result = await offlineAction(data);
    
    // Queue for sync when back online
    if (data) {
      await queueForSync(`${method}:${url}`, data);
    }
    
    return result;
  }
  
  throw new Error('No network connection and no offline fallback provided');
}

// Sync data when coming back online
export async function syncOfflineData(): Promise<void> {
  if (!isOnline()) return;
  
  const queue = await db.getSyncQueue();
  
  for (const item of queue) {
    try {
      const [method, url] = item.type.split(':');
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
        credentials: 'include'
      });
      
      // Remove from queue if successful
      await db.removeFromSyncQueue(item.id);
      
      // Invalidate related queries
      const queryKey = url.split('?')[0];
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      
    } catch (error) {
      console.error('Failed to sync item:', item, error);
    }
  }
}

// Register for online/offline events and sync when back online
export function setupOfflineSync(): void {
  window.addEventListener('online', () => {
    syncOfflineData();
  });
}

// API methods for drones
export const dronesApi = {
  getDrones: async (userId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/drones?userId=${userId}`,
      undefined,
      async () => db.getDrones(userId)
    );
  },
  
  getDrone: async (id: number): Promise<any> => {
    return apiRequest<any>(
      'GET',
      `/api/drones/${id}`,
      undefined,
      async () => db.getDrone(id)
    );
  },
  
  createDrone: async (drone: any): Promise<any> => {
    return apiRequest<any>(
      'POST',
      '/api/drones',
      drone,
      async (data) => {
        // Generate a temporary ID for offline use
        const offlineDrone = {
          ...data,
          id: Date.now(), // Temporary ID
          lastSync: new Date(),
          createdAt: new Date()
        };
        await db.saveDrone(offlineDrone);
        return offlineDrone;
      }
    );
  },
  
  updateDrone: async (id: number, drone: any): Promise<any> => {
    return apiRequest<any>(
      'PUT',
      `/api/drones/${id}`,
      drone,
      async (data) => {
        const existingDrone = await db.getDrone(id);
        if (!existingDrone) {
          throw new Error('Drone not found in offline storage');
        }
        const updatedDrone = { ...existingDrone, ...data };
        await db.saveDrone(updatedDrone);
        return updatedDrone;
      }
    );
  },
  
  deleteDrone: async (id: number): Promise<void> => {
    return apiRequest<void>(
      'DELETE',
      `/api/drones/${id}`,
      undefined,
      async () => {
        await db.delete('drones', id);
      }
    );
  }
};

// API methods for flight logs
export const flightLogsApi = {
  getFlightLogs: async (userId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/flight-logs?userId=${userId}`,
      undefined,
      async () => db.getFlightLogs(userId)
    );
  },
  
  getRecentFlightLogs: async (userId: number, limit: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/flight-logs?userId=${userId}&limit=${limit}`,
      undefined,
      async () => db.getRecentFlightLogs(userId, limit)
    );
  },
  
  getFlightLogsByDrone: async (droneId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/flight-logs?droneId=${droneId}`,
      undefined,
      async () => db.getFlightLogsByDrone(droneId)
    );
  },
  
  createFlightLog: async (log: any): Promise<any> => {
    return apiRequest<any>(
      'POST',
      '/api/flight-logs',
      log,
      async (data) => {
        const offlineLog = {
          ...data,
          id: Date.now(), // Temporary ID
          createdAt: new Date()
        };
        await db.saveFlightLog(offlineLog);
        return offlineLog;
      }
    );
  },
  
  updateFlightLog: async (id: number, log: any): Promise<any> => {
    return apiRequest<any>(
      'PUT',
      `/api/flight-logs/${id}`,
      log,
      async (data) => {
        const existingLog = await db.get('flightLogs', id);
        if (!existingLog) {
          throw new Error('Flight log not found in offline storage');
        }
        const updatedLog = { ...existingLog, ...data };
        await db.saveFlightLog(updatedLog);
        return updatedLog;
      }
    );
  }
};

// API methods for batteries
export const batteriesApi = {
  getBatteries: async (userId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/batteries?userId=${userId}`,
      undefined,
      async () => db.getBatteries(userId)
    );
  },
  
  getBatteriesByDrone: async (droneId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/batteries?droneId=${droneId}`,
      undefined,
      async () => db.getBatteriesByDrone(droneId)
    );
  },
  
  createBattery: async (battery: any): Promise<any> => {
    return apiRequest<any>(
      'POST',
      '/api/batteries',
      battery,
      async (data) => {
        const offlineBattery = {
          ...data,
          id: Date.now(), // Temporary ID
          createdAt: new Date()
        };
        await db.saveBattery(offlineBattery);
        return offlineBattery;
      }
    );
  },
  
  updateBattery: async (id: number, battery: any): Promise<any> => {
    return apiRequest<any>(
      'PUT',
      `/api/batteries/${id}`,
      battery,
      async (data) => {
        const existingBattery = await db.get('batteries', id);
        if (!existingBattery) {
          throw new Error('Battery not found in offline storage');
        }
        const updatedBattery = { ...existingBattery, ...data };
        await db.saveBattery(updatedBattery);
        return updatedBattery;
      }
    );
  }
};

// API methods for weather data
export const weatherApi = {
  getWeather: async (userId: number, location: string): Promise<any> => {
    return apiRequest<any>(
      'GET',
      `/api/weather?userId=${userId}&location=${encodeURIComponent(location)}`,
      undefined,
      async () => db.getLatestWeather(userId, location)
    );
  },
  
  saveWeatherData: async (data: any): Promise<any> => {
    return apiRequest<any>(
      'POST',
      '/api/weather',
      data,
      async (weatherData) => {
        const offlineWeatherData = {
          ...weatherData,
          id: Date.now(), // Temporary ID
          timestamp: new Date()
        };
        await db.saveWeatherData(offlineWeatherData);
        return offlineWeatherData;
      }
    );
  }
};

// API methods for flight plans
export const flightPlansApi = {
  getFlightPlans: async (userId: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/flight-plans?userId=${userId}`,
      undefined,
      async () => db.getFlightPlans(userId)
    );
  },
  
  getAiSuggestions: async (userId: number, limit: number): Promise<any[]> => {
    return apiRequest<any[]>(
      'GET',
      `/api/flight-plans?userId=${userId}&aiSuggestions=true&limit=${limit}`,
      undefined,
      async () => db.getAISuggestions(userId, limit)
    );
  },
  
  createFlightPlan: async (plan: any): Promise<any> => {
    return apiRequest<any>(
      'POST',
      '/api/flight-plans',
      plan,
      async (data) => {
        const offlinePlan = {
          ...data,
          id: Date.now(), // Temporary ID
          createdAt: new Date()
        };
        await db.saveFlightPlan(offlinePlan);
        return offlinePlan;
      }
    );
  },
  
  updateFlightPlan: async (id: number, plan: any): Promise<any> => {
    return apiRequest<any>(
      'PUT',
      `/api/flight-plans/${id}`,
      plan,
      async (data) => {
        const existingPlan = await db.get('flightPlans', id);
        if (!existingPlan) {
          throw new Error('Flight plan not found in offline storage');
        }
        const updatedPlan = { ...existingPlan, ...data };
        await db.saveFlightPlan(updatedPlan);
        return updatedPlan;
      }
    );
  }
};

// API methods for stats
export const statsApi = {
  getUserStats: async (userId: number): Promise<any> => {
    return apiRequest<any>(
      'GET',
      `/api/stats?userId=${userId}`,
      undefined,
      async () => {
        // Calculate stats from offline data
        const flights = await db.getFlightLogs(userId);
        const drones = await db.getDrones(userId);
        
        const totalFlights = flights.length;
        
        const flightHours = flights.reduce((total, flight) => {
          return total + ((flight.duration || 0) / 3600); // Convert seconds to hours
        }, 0);
        
        const maxDistance = flights.reduce((max, flight) => {
          return Math.max(max, flight.distance || 0);
        }, 0);
        
        const activeDrones = drones.filter(drone => 
          drone.status === 'ready' || drone.status === 'flying' || drone.status === 'needs_calibration'
        ).length;
        
        return {
          totalFlights,
          flightHours: parseFloat(flightHours.toFixed(1)),
          maxDistance: parseFloat(maxDistance.toFixed(1)),
          activeDrones
        };
      }
    );
  }
};

// Initialize the offline sync setup
setupOfflineSync();

export default {
  syncOfflineData,
  dronesApi,
  flightLogsApi,
  batteriesApi,
  weatherApi,
  flightPlansApi,
  statsApi
};
