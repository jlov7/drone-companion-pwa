import { openDB, STORE_DRONES } from './indexedDB';
import type { DroneProfile } from '../types/data';

/**
 * Adds a new drone profile to the IndexedDB.
 * @param {Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'>} droneData - The drone data to add (id, createdAt, updatedAt will be added).
 * @returns {Promise<string>} A promise that resolves with the ID of the newly added drone.
 */
export const addDrone = async (droneData: Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_DRONES, 'readwrite');
  const store = transaction.objectStore(STORE_DRONES);

  const now = Date.now();
  // Simple ID generation - consider UUID library for production robustness
  const newId = `drone_${now}_${Math.random().toString(36).substring(2, 9)}`;

  const droneToAdd: DroneProfile = {
    ...droneData,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(droneToAdd);

    request.onsuccess = () => {
      resolve(newId);
    };

    request.onerror = (event) => {
      console.error('Error adding drone:', (event.target as IDBRequest).error);
      reject(`Error adding drone: ${(event.target as IDBRequest).error}`);
    };
  });
};

/**
 * Retrieves a specific drone profile by its ID.
 * @param {string} id - The ID of the drone to retrieve.
 * @returns {Promise<DroneProfile | undefined>} A promise that resolves with the drone profile or undefined if not found.
 */
export const getDrone = async (id: string): Promise<DroneProfile | undefined> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_DRONES, 'readonly');
  const store = transaction.objectStore(STORE_DRONES);

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as DroneProfile | undefined);
    };

    request.onerror = (event) => {
      console.error('Error getting drone:', (event.target as IDBRequest).error);
      reject(`Error getting drone: ${(event.target as IDBRequest).error}`);
    };
  });
};

/**
 * Retrieves all drone profiles from the IndexedDB.
 * @returns {Promise<DroneProfile[]>} A promise that resolves with an array of all drone profiles.
 */
export const getAllDrones = async (): Promise<DroneProfile[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_DRONES, 'readonly');
  const store = transaction.objectStore(STORE_DRONES);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as DroneProfile[]);
    };

    request.onerror = (event) => {
      console.error('Error getting all drones:', (event.target as IDBRequest).error);
      reject(`Error getting all drones: ${(event.target as IDBRequest).error}`);
    };
  });
};

/**
 * Updates an existing drone profile.
 * @param {Partial<DroneProfile> & { id: string }} droneData - The drone data to update (must include the id). Fields other than id will be updated.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateDrone = async (droneData: Partial<DroneProfile> & { id: string }): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_DRONES, 'readwrite');
    const store = transaction.objectStore(STORE_DRONES);

    // First, get the existing drone to merge updates
    const getRequest = store.get(droneData.id);

    return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
            const existingDrone = getRequest.result as DroneProfile | undefined;
            if (!existingDrone) {
                reject(`Drone with ID ${droneData.id} not found.`);
                return;
            }

            const droneToUpdate: DroneProfile = {
                ...existingDrone,
                ...droneData, // Apply updates
                updatedAt: Date.now(), // Update the timestamp
            };

            const updateRequest = store.put(droneToUpdate);

            updateRequest.onsuccess = () => {
                resolve();
            };

            updateRequest.onerror = (event) => {
                console.error('Error updating drone:', (event.target as IDBRequest).error);
                reject(`Error updating drone: ${(event.target as IDBRequest).error}`);
            };
        };

        getRequest.onerror = (event) => {
            console.error('Error finding drone to update:', (event.target as IDBRequest).error);
            reject(`Error finding drone to update: ${(event.target as IDBRequest).error}`);
        };
    });
};


/**
 * Deletes a drone profile by its ID.
 * @param {string} id - The ID of the drone to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export const deleteDrone = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_DRONES, 'readwrite');
  const store = transaction.objectStore(STORE_DRONES);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error deleting drone:', (event.target as IDBRequest).error);
      reject(`Error deleting drone: ${(event.target as IDBRequest).error}`);
    };
  });
}; 