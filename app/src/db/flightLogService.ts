import { openDB, STORE_FLIGHT_LOGS } from './indexedDB';
import type { FlightLog } from '../types/data';

// --- Helper for generating IDs (consider moving to a shared utils file) ---
const generateId = (prefix: string): string => {
    const now = Date.now();
    return `${prefix}_${now}_${Math.random().toString(36).substring(2, 9)}`;
};

// --- Flight Log CRUD Functions ---

/**
 * Adds a new flight log to the IndexedDB.
 * @param {Omit<FlightLog, 'id' | 'createdAt' | 'updatedAt'>} logData - The flight log data to add.
 * @returns {Promise<string>} A promise that resolves with the ID of the newly added log.
 */
export const addFlightLog = async (logData: Omit<FlightLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_FLIGHT_LOGS, 'readwrite');
    const store = transaction.objectStore(STORE_FLIGHT_LOGS);

    const now = Date.now();
    const newId = generateId('log');

    const logToAdd: FlightLog = {
        ...logData,
        id: newId,
        createdAt: now,
        updatedAt: now,
    };

    return new Promise((resolve, reject) => {
        const request = store.add(logToAdd);

        request.onsuccess = () => {
            resolve(newId);
        };

        request.onerror = (event) => {
            console.error('Error adding flight log:', (event.target as IDBRequest).error);
            reject(`Error adding flight log: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Retrieves a specific flight log by its ID.
 * @param {string} id - The ID of the flight log to retrieve.
 * @returns {Promise<FlightLog | undefined>} A promise that resolves with the log or undefined if not found.
 */
export const getFlightLog = async (id: string): Promise<FlightLog | undefined> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_FLIGHT_LOGS, 'readonly');
    const store = transaction.objectStore(STORE_FLIGHT_LOGS);

    return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result as FlightLog | undefined);
        };

        request.onerror = (event) => {
            console.error('Error getting flight log:', (event.target as IDBRequest).error);
            reject(`Error getting flight log: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Retrieves all flight logs from the IndexedDB.
 * Optionally sorts by date descending.
 * @param {boolean} [sortByDateDesc=true] - Whether to sort results by date descending.
 * @returns {Promise<FlightLog[]>} A promise that resolves with an array of flight logs.
 */
export const getAllFlightLogs = async (sortByDateDesc: boolean = true): Promise<FlightLog[]> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_FLIGHT_LOGS, 'readonly');
    const store = transaction.objectStore(STORE_FLIGHT_LOGS);

    // Note: The index created was on 'date', not 'flightDate'. Assuming 'flightDate' is the intended field.
    // If an index on 'flightDate' is desired, it should be added during onupgradeneeded.
    // For now, we retrieve all and sort in memory.
    // const index = store.index('flightDate_idx'); // If an index exists

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
            let results = request.result as FlightLog[];
            if (sortByDateDesc) {
                // Sort by flightDate descending (most recent first)
                results.sort((a, b) => b.flightDate - a.flightDate);
            }
            resolve(results);
        };

        request.onerror = (event) => {
            console.error('Error getting all flight logs:', (event.target as IDBRequest).error);
            reject(`Error getting all flight logs: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Updates an existing flight log.
 * Merges provided partial data with the existing log.
 * @param {Partial<FlightLog> & { id: string }} logUpdateData - The partial flight log data to update (must include the id).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateFlightLog = async (logUpdateData: Partial<FlightLog> & { id: string }): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_FLIGHT_LOGS, 'readwrite');
    const store = transaction.objectStore(STORE_FLIGHT_LOGS);

    // Get the existing log first
    const getRequest = store.get(logUpdateData.id);

    return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
            const existingLog = getRequest.result as FlightLog | undefined;
            if (!existingLog) {
                reject(`Flight log with ID ${logUpdateData.id} not found for update.`);
                return;
            }

            // Merge existing log with the update data
            const logToUpdate: FlightLog = {
                ...existingLog,
                ...logUpdateData, // Apply partial updates
                updatedAt: Date.now(), // Update the timestamp
            };

            // Perform the update with the merged data
            const updateRequest = store.put(logToUpdate);

            updateRequest.onsuccess = () => {
                resolve();
            };

            updateRequest.onerror = (event) => {
                console.error('Error updating flight log:', (event.target as IDBRequest).error);
                reject(`Error updating flight log: ${(event.target as IDBRequest).error}`);
            };
        };
         getRequest.onerror = (event) => {
            console.error('Error finding flight log to update:', (event.target as IDBRequest).error);
            reject(`Error finding flight log to update: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Deletes a flight log by its ID.
 * @param {string} id - The ID of the flight log to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export const deleteFlightLog = async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_FLIGHT_LOGS, 'readwrite');
    const store = transaction.objectStore(STORE_FLIGHT_LOGS);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting flight log:', (event.target as IDBRequest).error);
            reject(`Error deleting flight log: ${(event.target as IDBRequest).error}`);
        };
    });
};

// Potential future functions:
// - getFlightLogsByDroneId(droneId: string): Promise<FlightLog[]>
// - getTotalFlightTime(): Promise<number>
// - getTotalFlightTimeByDrone(droneId: string): Promise<number>
// (These might belong in a statistics service later) 