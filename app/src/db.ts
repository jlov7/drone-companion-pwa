import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { DroneProfile, Checklist, FlightLog, UnlockedAchievement } from './types/data';

const DB_NAME = 'DroneCompanionDB';
const DB_VERSION = 1;

// Define index types separately
type DroneIndexes = { 'by-name': string };
// TODO: Re-add 'by-droneId': string index later if needed and type issue resolved.
// type ChecklistIndexes = { 'by-droneId': string, 'isTemplate': boolean };
type ChecklistIndexes = { 'isTemplate': boolean }; // Temporarily removed by-droneId
type FlightLogIndexes = { 'by-droneId': string, 'by-date': number };
type AchievementIndexes = { 'by-unlockedAt': number };

// Define the database schema using the DBSchema interface
interface DroneAppDB extends DBSchema {
  drones: {
    key: string;
    value: DroneProfile;
    indexes: DroneIndexes;
  };
  checklists: {
    key: string;
    value: Checklist;
    indexes: ChecklistIndexes;
  };
  flightLogs: {
    key: string;
    value: FlightLog;
    indexes: FlightLogIndexes;
  };
  achievements: {
    key: string;
    value: UnlockedAchievement;
    indexes: AchievementIndexes;
  };
  [key: string]: any; // Add this line to make string index type compatible
}

let dbPromise: Promise<IDBPDatabase<DroneAppDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<DroneAppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DroneAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}...`);

        if (oldVersion < 1) {
          const droneStore = db.createObjectStore('drones', { keyPath: 'id' });
          droneStore.createIndex('by-name', 'name');

          const checklistStore = db.createObjectStore('checklists', { keyPath: 'id' });
          // checklistStore.createIndex('by-droneId', 'droneId'); // Temporarily removed
          checklistStore.createIndex('isTemplate', 'isTemplate');

          const flightLogStore = db.createObjectStore('flightLogs', { keyPath: 'id' });
          flightLogStore.createIndex('by-droneId', 'droneId');
          flightLogStore.createIndex('by-date', 'flightDate');

          const achievementStore = db.createObjectStore('achievements', { keyPath: 'id' });
          achievementStore.createIndex('by-unlockedAt', 'unlockedAt');

          console.log('Created object stores: drones, checklists, flightLogs, achievements');
        }
      },
      blocked() {
        console.error('IndexedDB blocked...');
        alert('Database upgrade blocked. Please close other instances.');
      },
      blocking() {
        console.warn('IndexedDB blocking...');
        dbPromise = null;
      },
      terminated() {
        console.error('IndexedDB connection terminated.');
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

// Initialize DB connection on load
getDb().then(() => {
  console.log('Database connection initialized.');
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
});

// Example basic CRUD function structure (implement fully in later tasks)

// export async function addDrone(drone: DroneProfile): Promise<string> {
//   const db = await getDb();
//   return db.add('drones', drone);
// }

// Call getDb() once early in the app lifecycle (e.g., in main.ts or App.vue setup)
// to initiate the connection and upgrade process if needed.
getDb().then(() => {
  console.log('Database connection initialized.');
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
}); 