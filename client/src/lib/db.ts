// IndexedDB wrapper for offline data storage
const DB_NAME = 'drone-logger-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  DRONES: 'drones',
  FLIGHT_LOGS: 'flightLogs',
  BATTERIES: 'batteries',
  WEATHER_DATA: 'weatherData',
  FLIGHT_PLANS: 'flightPlans',
  SYNC_QUEUE: 'syncQueue',
  OFFLINE_USER: 'offlineUser'
};

// Define the database schema
const DB_SCHEMA = [
  {
    name: STORES.DRONES,
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' }
    ]
  },
  {
    name: STORES.FLIGHT_LOGS,
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' },
      { name: 'droneId', keyPath: 'droneId' },
      { name: 'startTime', keyPath: 'startTime' }
    ]
  },
  {
    name: STORES.BATTERIES,
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' },
      { name: 'droneId', keyPath: 'droneId' }
    ]
  },
  {
    name: STORES.WEATHER_DATA,
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' },
      { name: 'location', keyPath: 'location' },
      { name: 'timestamp', keyPath: 'timestamp' }
    ]
  },
  {
    name: STORES.FLIGHT_PLANS,
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' },
      { name: 'isAiGenerated', keyPath: 'isAiGenerated' }
    ]
  },
  {
    name: STORES.SYNC_QUEUE,
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  },
  {
    name: STORES.OFFLINE_USER,
    keyPath: 'id'
  }
];

class DroneLoggerDB {
  private db: IDBDatabase | null = null;
  
  // Initialize the database
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Database error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = (event) => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create object stores based on schema
        DB_SCHEMA.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath, autoIncrement: true });
            
            // Add indexes
            store.indexes?.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath);
            });
          }
        });
      };
    });
  }
  
  // Generic method to add data to a store
  async add<T>(storeName: string, data: T): Promise<number> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Generic method to get data by key
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result as T);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Generic method to put (update or insert) data
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Generic method to delete data
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Get all data from a store
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Get data by index
  async getByIndex<T>(
    storeName: string, 
    indexName: string, 
    key: IDBValidKey
  ): Promise<T[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Clear all data from a store
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  // Add an item to the sync queue
  async addToSyncQueue(type: string, data: any): Promise<number> {
    return this.add(STORES.SYNC_QUEUE, {
      type,
      data,
      createdAt: new Date()
    });
  }
  
  // Get all items from the sync queue
  async getSyncQueue(): Promise<any[]> {
    return this.getAll(STORES.SYNC_QUEUE);
  }
  
  // Remove an item from the sync queue
  async removeFromSyncQueue(id: IDBValidKey): Promise<void> {
    return this.delete(STORES.SYNC_QUEUE, id);
  }
  
  // Specific methods for drones
  async getDrones(userId: number): Promise<any[]> {
    return this.getByIndex(STORES.DRONES, 'userId', userId);
  }
  
  async getDrone(id: number): Promise<any> {
    return this.get(STORES.DRONES, id);
  }
  
  async saveDrone(drone: any): Promise<IDBValidKey> {
    return this.put(STORES.DRONES, drone);
  }
  
  // Specific methods for flight logs
  async getFlightLogs(userId: number): Promise<any[]> {
    return this.getByIndex(STORES.FLIGHT_LOGS, 'userId', userId);
  }
  
  async getRecentFlightLogs(userId: number, limit: number): Promise<any[]> {
    const logs = await this.getByIndex(STORES.FLIGHT_LOGS, 'userId', userId);
    return logs
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }
  
  async getFlightLogsByDrone(droneId: number): Promise<any[]> {
    return this.getByIndex(STORES.FLIGHT_LOGS, 'droneId', droneId);
  }
  
  async saveFlightLog(log: any): Promise<IDBValidKey> {
    return this.put(STORES.FLIGHT_LOGS, log);
  }
  
  // Specific methods for batteries
  async getBatteries(userId: number): Promise<any[]> {
    return this.getByIndex(STORES.BATTERIES, 'userId', userId);
  }
  
  async getBatteriesByDrone(droneId: number): Promise<any[]> {
    return this.getByIndex(STORES.BATTERIES, 'droneId', droneId);
  }
  
  async saveBattery(battery: any): Promise<IDBValidKey> {
    return this.put(STORES.BATTERIES, battery);
  }
  
  // Specific methods for weather data
  async getLatestWeather(userId: number, location: string): Promise<any | undefined> {
    const weatherData = await this.getByIndex(STORES.WEATHER_DATA, 'location', location);
    const userWeather = weatherData.filter(w => w.userId === userId);
    
    if (userWeather.length === 0) return undefined;
    
    // Return the most recent weather data
    return userWeather.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }
  
  async saveWeatherData(data: any): Promise<IDBValidKey> {
    return this.put(STORES.WEATHER_DATA, data);
  }
  
  // Specific methods for flight plans
  async getFlightPlans(userId: number): Promise<any[]> {
    return this.getByIndex(STORES.FLIGHT_PLANS, 'userId', userId);
  }
  
  async getAISuggestions(userId: number, limit: number): Promise<any[]> {
    const plans = await this.getByIndex(STORES.FLIGHT_PLANS, 'userId', userId);
    return plans
      .filter(plan => plan.isAiGenerated)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async saveFlightPlan(plan: any): Promise<IDBValidKey> {
    return this.put(STORES.FLIGHT_PLANS, plan);
  }
  
  // Save offline user info
  async saveOfflineUser(user: any): Promise<IDBValidKey> {
    return this.put(STORES.OFFLINE_USER, user);
  }
  
  // Get offline user info
  async getOfflineUser(): Promise<any | undefined> {
    return this.get(STORES.OFFLINE_USER, 1);
  }
}

export const db = new DroneLoggerDB();
export default db;
