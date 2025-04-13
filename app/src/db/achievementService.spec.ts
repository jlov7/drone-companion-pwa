import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
    getUnlockedAchievements,
    isAchievementUnlocked,
    addUnlockedAchievement,
    checkAndUnlockAchievements
} from './achievementService';
import * as statsService from './statsService';
import * as flightLogService from './flightLogService';
import { openDB, STORE_ACHIEVEMENTS } from './indexedDB'; // Import from indexedDB mock
import { getDroneSpecificAchievementId } from '../config/achievements';
import type { CalculatedStats, FlightLog, UnlockedAchievement, StatsByDrone } from '../types/data';

// --- Mocks --- 
vi.mock('./statsService');
vi.mock('./flightLogService');

// Mock IndexedDB - avoid top level variables that would cause hoisting issues
vi.mock('./indexedDB', () => ({
  openDB: vi.fn(),
  STORE_ACHIEVEMENTS: 'achievements',
  STORE_DRONES: 'drones', 
  STORE_CHECKLISTS: 'checklists', 
  STORE_FLIGHT_LOGS: 'flightLogs',
}));

// --- Mock Data Factories ---
const createMockStats = (overrides: Partial<CalculatedStats> = {}): CalculatedStats => ({
    totalFlights: 0,
    totalFlightTimeMinutes: 0,
    averageFlightTimeMinutes: 0,
    statsByDrone: [],
    ...overrides,
});

const createMockLog = (overrides: Partial<FlightLog>): FlightLog => ({
    id: `log_${Math.random()}`,
    droneId: 'd1',
    droneName: 'Test Drone',
    flightDate: Date.now(),
    durationMinutes: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
});

const createMockDroneStat = (overrides: Partial<StatsByDrone>): StatsByDrone => ({
    droneId: `drone_${Math.random()}`,
    droneName: 'Some Drone',
    flightCount: 0,
    totalTimeMinutes: 0,
    averageTimeMinutes: 0,
    ...overrides,
});

// --- Tests for checkAndUnlockAchievements ---
describe('Achievement Service - checkAndUnlockAchievements', () => {
    // Define types for mock objects here if needed, or rely on inference
    let mockAchievementStoreData: Map<string, UnlockedAchievement>;
    let mockStore: any; // Use 'any' or define a more specific mock type
    let mockTransaction: any;
    let mockDb: any;

    beforeEach(() => {
        // Reset mocks before each test
        vi.mocked(statsService.calculateAllStats).mockClear();
        vi.mocked(flightLogService.getAllFlightLogs).mockClear();
        vi.clearAllMocks(); // Clear all mocks including DB mocks

        // --- DEFINE & Configure mock implementations HERE in beforeEach ---
        // Instantiate the mock store data structure
        mockAchievementStoreData = new Map<string, UnlockedAchievement>();

        // Define the mock store object
        mockStore = {
            add: vi.fn().mockImplementation((data: UnlockedAchievement) => {
                return new Promise((resolve) => {
                    // Use the mockAchievementStoreData defined in this scope
                    if (mockAchievementStoreData.has(data.id)) {
                        mockAchievementStoreData.set(data.id, { ...data });
                        resolve(data.id);
                    } else {
                        mockAchievementStoreData.set(data.id, { ...data });
                        resolve(data.id);
                    }
                    // Simplified mock implementation w/o request object simulation for brevity
                });
            }),
            get: vi.fn().mockImplementation((id: string) => {
                return new Promise((resolve) => {
                    const found = mockAchievementStoreData.get(id); // Use scoped map
                    resolve(found ? { ...found } : undefined);
                });
            }),
            getAll: vi.fn().mockImplementation(() => {
                return new Promise((resolve) => {
                    // Use scoped map
                    resolve(Array.from(mockAchievementStoreData.values()).map(ach => ({ ...ach })));
                });
            }),
            // Add other methods like put, delete if needed by the service
        };

        // Define the mock transaction object
        mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore), // Return the mockStore defined above
            oncomplete: null, onerror: null, abort: vi.fn(),
        };

        // Define the mock DB object
        mockDb = {
            transaction: vi.fn().mockReturnValue(mockTransaction), // Return the mockTransaction defined above
            name: 'mockDB', version: 1,
            objectStoreNames: { contains: (name: string) => name === STORE_ACHIEVEMENTS } as unknown as DOMStringList,
            close: vi.fn(), createObjectStore: vi.fn(), deleteObjectStore: vi.fn(),
            onabort: null, onclose: null, onerror: null, onversionchange: null,
            addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
        };

        // Configure the mock openDB function (imported via the mock)
        (openDB as MockedFunction<typeof openDB>).mockResolvedValue(mockDb as unknown as IDBDatabase);
    });

    it('should not unlock anything if no criteria are met', async () => {
        const mockStats = createMockStats({ totalFlights: 0 });
        const mockLogs: FlightLog[] = [];
        // No initial unlocked achievements in mock store

        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toEqual([]);
        expect(mockStore.add).not.toHaveBeenCalled(); // Check DB mock store add
    });

    it('should unlock the first_flight achievement', async () => {
        const mockStats = createMockStats({ totalFlights: 1 });
        const mockLogs: FlightLog[] = [createMockLog({})];
        // No initial unlocked achievements

        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toEqual(['first_flight']);
        expect(mockStore.add).toHaveBeenCalledTimes(1);
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'first_flight' }));
        expect(mockAchievementStoreData.has('first_flight')).toBe(true); // Verify store state
    });

    it('should not unlock an already unlocked achievement', async () => {
        const mockStats = createMockStats({ totalFlights: 2 });
        const mockLogs: FlightLog[] = [createMockLog({}), createMockLog({})];
        // Pre-populate the mock store with the achievement
        mockAchievementStoreData.set('first_flight', { id: 'first_flight', unlockedAt: Date.now() });

        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toEqual([]); // Nothing new should be unlocked
        expect(mockStore.add).not.toHaveBeenCalled();
    });

    it('should unlock multiple achievements at once', async () => {
        const mockStats = createMockStats({ totalFlights: 5, totalFlightTimeMinutes: 65 });
        const mockLogs: FlightLog[] = Array(5).fill(0).map(() => createMockLog({ durationMinutes: 13 }));
        mockAchievementStoreData.set('first_flight', { id: 'first_flight', unlockedAt: Date.now() }); // Pre-unlocked

        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toContain('getting_started');
        expect(newlyUnlocked).toContain('air_time_apprentice');
        expect(newlyUnlocked.length).toBe(2);
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'getting_started' }));
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'air_time_apprentice' }));
        expect(mockAchievementStoreData.has('getting_started')).toBe(true);
        expect(mockAchievementStoreData.has('air_time_apprentice')).toBe(true);
    });

    it('should unlock a drone-specific achievement', async () => {
        // Use the drone_specialist achievement which triggers at 10 flights per drone
        const droneId = 'd1';
        const specificId = getDroneSpecificAchievementId('drone_specialist', droneId);
        
        console.log('TEST: Beginning test with specificId:', specificId);
        
        // Clear existing mocks and data
        vi.clearAllMocks();
        mockAchievementStoreData.clear();
        
        // Custom implementation for store.getAll to return empty array (no unlocked achievements)
        mockStore.getAll.mockResolvedValueOnce([]);
        
        // Create spy for the add function to track additions
        const addSpy = vi.spyOn(mockStore, 'add');
        
        // Create stats showing 10 flights for our test drone
        const mockStats = createMockStats({
            totalFlights: 10,
            statsByDrone: [
                createMockDroneStat({ 
                    droneId, 
                    flightCount: 10, // Triggers drone_specialist achievement
                    totalTimeMinutes: 100
                })
            ]
        });
        
        console.log('TEST: Created mockStats:', JSON.stringify(mockStats, null, 2));
        
        // Setup mocks
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue([
            createMockLog({ droneId })
        ]);
        
        // Run the function under test
        const newlyUnlocked = await checkAndUnlockAchievements();
        console.log('TEST: Newly unlocked achievements:', newlyUnlocked);
        
        // Log what was actually called
        console.log('TEST: addSpy call count:', addSpy.mock.calls.length);
        for (let i = 0; i < addSpy.mock.calls.length; i++) {
            console.log(`TEST: addSpy call ${i}:`, JSON.stringify(addSpy.mock.calls[i][0], null, 2));
        }
        
        // Verify the specific achievement was created in the store
        expect(addSpy).toHaveBeenCalled();
        
        // Verify at least one call to add had our specific ID
        const specificAchievementAdded = addSpy.mock.calls.some(call => {
            const hasCorrectId = call[0] && typeof call[0] === 'object' && 'id' in call[0] && 
                call[0].id === specificId;
            console.log('TEST: Call ID check:', (call[0] as any)?.id, 'expected:', specificId, 'match:', hasCorrectId);
            return hasCorrectId;
        });
        
        console.log('TEST: specificAchievementAdded:', specificAchievementAdded);
        
        expect(specificAchievementAdded).toBe(true);
    });

    it('should not unlock a drone-specific achievement if already unlocked for that drone', async () => {
        // Create a specific mock for this test
        const specificId = getDroneSpecificAchievementId('drone_specialist', 'd1');
        
        // Make sure all other tests' mocks are reset
        vi.clearAllMocks();
        mockAchievementStoreData.clear();
        
        // Set up mock to show this achievement is already unlocked
        mockAchievementStoreData.set(specificId, { id: specificId, unlockedAt: Date.now() });
        
        // Return the already unlocked achievement from the mock store
        mockStore.getAll.mockResolvedValueOnce([
            { id: specificId, unlockedAt: Date.now() }
        ]);
        
        // Mock drone-specific stats that would qualify
        const drone1Stats = createMockDroneStat({ droneId: 'd1', flightCount: 10, totalTimeMinutes: 100 });
        const mockStats = createMockStats({ 
            totalFlights: 10, 
            statsByDrone: [drone1Stats] 
        });
        const mockLogs: FlightLog[] = [createMockLog({ droneId: 'd1' })];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);
        
        // A spy specifically for the add operation to ensure it's not called for this ID
        const addSpy = vi.spyOn(mockStore, 'add');
        
        // Call function under test
        const result = await checkAndUnlockAchievements();
        
        // We should not have unlocked this specific achievement again
        expect(result.includes(specificId)).toBe(false);
        expect(addSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: specificId }));
        
        // Clean up
        addSpy.mockRestore();
    });

    it('should unlock log-based achievements (e.g., early_bird)', async () => {
        const mockStats = createMockStats({ totalFlights: 1 });
        const earlyLog = createMockLog({ flightDate: new Date().setHours(6, 30, 0, 0) }); // 6:30 AM
        const mockLogs: FlightLog[] = [earlyLog];
        mockAchievementStoreData.set('first_flight', { id: 'first_flight', unlockedAt: Date.now()}); // Assume first flight unlocked

        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toEqual(['early_bird']);
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'early_bird' }));
        expect(mockAchievementStoreData.has('early_bird')).toBe(true);
    });

    it('should handle errors during processing gracefully', async () => {
        const errorMessage = "Failed to get stats";
        vi.mocked(statsService.calculateAllStats).mockRejectedValue(new Error(errorMessage));
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue([]);
        // No initial unlocked

        // We expect it to catch the error, log it, and return an empty array
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console output

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockStore.add).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore(); // Clean up the spy
    });
});

// --- Tests for direct DB functions ---
describe('Achievement Service - Basic DB Functions', () => {
    // Similar setup as the previous test suite
    let mockAchievementStoreData: Map<string, UnlockedAchievement>;
    let mockStore: any;
    let mockTransaction: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAchievementStoreData = new Map<string, UnlockedAchievement>();

        mockStore = {
            add: vi.fn().mockImplementation((data: UnlockedAchievement) => {
                return new Promise((resolve) => {
                    mockAchievementStoreData.set(data.id, { ...data });
                    resolve(data.id);
                });
            }),
            get: vi.fn().mockImplementation((id: string) => {
                return new Promise((resolve) => {
                    const found = mockAchievementStoreData.get(id);
                    resolve(found ? { ...found } : undefined);
                });
            }),
            getAll: vi.fn().mockImplementation(() => {
                return new Promise((resolve) => {
                    resolve(Array.from(mockAchievementStoreData.values()).map(ach => ({ ...ach })));
                });
            }),
        };

        mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore),
            oncomplete: null, onerror: null, abort: vi.fn(),
        };

        mockDb = {
            transaction: vi.fn().mockReturnValue(mockTransaction),
            name: 'mockDB', version: 1,
            objectStoreNames: { contains: (name: string) => name === STORE_ACHIEVEMENTS } as unknown as DOMStringList,
            close: vi.fn(), createObjectStore: vi.fn(), deleteObjectStore: vi.fn(),
            onabort: null, onclose: null, onerror: null, onversionchange: null,
            addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
        };

        (openDB as MockedFunction<typeof openDB>).mockResolvedValue(mockDb as unknown as IDBDatabase);
    });

    it('getUnlockedAchievements should retrieve all from mock store', async () => {
        const ach1 = { id: 'a1', unlockedAt: Date.now() };
        const ach2 = { id: 'a2', unlockedAt: Date.now() };
        mockAchievementStoreData.set(ach1.id, ach1);
        mockAchievementStoreData.set(ach2.id, ach2);

        const result = await getUnlockedAchievements();
        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([ach1, ach2]));
        expect(openDB).toHaveBeenCalled();
        expect(mockDb.transaction).toHaveBeenCalledWith(STORE_ACHIEVEMENTS, 'readonly');
        expect(mockStore.getAll).toHaveBeenCalled();
    });

    it('addUnlockedAchievement should add to mock store', async () => {
        const achievementId = 'new_ach';
        await addUnlockedAchievement(achievementId);
        expect(openDB).toHaveBeenCalled();
        expect(mockDb.transaction).toHaveBeenCalledWith(STORE_ACHIEVEMENTS, 'readwrite');
        expect(mockStore.get).toHaveBeenCalledWith(achievementId);
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: achievementId }));
        expect(mockAchievementStoreData.has(achievementId)).toBe(true);
        expect(mockAchievementStoreData.get(achievementId)?.unlockedAt).toBeTypeOf('number');
    });

    it('isAchievementUnlocked should return true if found in mock store', async () => {
        const achievementId = 'existing_ach';
        mockAchievementStoreData.set(achievementId, { id: achievementId, unlockedAt: Date.now() });
        
        const result = await isAchievementUnlocked(achievementId);
        expect(result).toBe(true);
        expect(openDB).toHaveBeenCalled();
        expect(mockDb.transaction).toHaveBeenCalledWith(STORE_ACHIEVEMENTS, 'readonly');
        expect(mockStore.get).toHaveBeenCalledWith(achievementId);
    });

    it('isAchievementUnlocked should return false if not found in mock store', async () => {
        const achievementId = 'non_existent_ach';
        const result = await isAchievementUnlocked(achievementId);
        expect(result).toBe(false);
        expect(openDB).toHaveBeenCalled();
        expect(mockDb.transaction).toHaveBeenCalledWith(STORE_ACHIEVEMENTS, 'readonly');
        expect(mockStore.get).toHaveBeenCalledWith(achievementId);
    });

    it('should handle database errors in isAchievementUnlocked', async () => {
        const dbError = new Error('DB connection failed');
        (openDB as MockedFunction<typeof openDB>).mockRejectedValueOnce(dbError);
        
        await expect(isAchievementUnlocked('any_id')).rejects.toThrow(dbError);
    });

    it('should handle database errors in getUnlockedAchievements', async () => {
        const dbError = new Error('DB connection failed');
        (openDB as MockedFunction<typeof openDB>).mockRejectedValueOnce(dbError);
        
        await expect(getUnlockedAchievements()).rejects.toThrow(dbError);
    });

    it('should handle database errors in addUnlockedAchievement', async () => {
        const dbError = new Error('DB connection failed');
        (openDB as MockedFunction<typeof openDB>).mockRejectedValueOnce(dbError);
        
        await expect(addUnlockedAchievement('any_id')).rejects.toThrow(dbError);
    });
});

// Additional tests for specific achievements
describe('Achievement Service - Special Achievement Checks', () => {
    // Similar setup as before
    let mockAchievementStoreData: Map<string, UnlockedAchievement>;
    let mockStore: any;
    let mockTransaction: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAchievementStoreData = new Map<string, UnlockedAchievement>();

        mockStore = {
            add: vi.fn().mockImplementation((data: UnlockedAchievement) => {
                return new Promise((resolve) => {
                    mockAchievementStoreData.set(data.id, { ...data });
                    resolve(data.id);
                });
            }),
            get: vi.fn().mockImplementation((id: string) => {
                return new Promise((resolve) => {
                    const found = mockAchievementStoreData.get(id);
                    resolve(found ? { ...found } : undefined);
                });
            }),
            getAll: vi.fn().mockImplementation(() => {
                return new Promise((resolve) => {
                    resolve(Array.from(mockAchievementStoreData.values()).map(ach => ({ ...ach })));
                });
            }),
        };

        mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore),
            oncomplete: null, onerror: null, abort: vi.fn(),
        };

        mockDb = {
            transaction: vi.fn().mockReturnValue(mockTransaction),
            name: 'mockDB', version: 1,
            objectStoreNames: { contains: (name: string) => name === STORE_ACHIEVEMENTS } as unknown as DOMStringList,
            close: vi.fn(), createObjectStore: vi.fn(), deleteObjectStore: vi.fn(),
            onabort: null, onclose: null, onerror: null, onversionchange: null,
            addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
        };

        (openDB as MockedFunction<typeof openDB>).mockResolvedValue(mockDb as unknown as IDBDatabase);
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(createMockStats());
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue([]);
    });

    it('should unlock the weekend_warrior achievement', async () => {
        const mockStats = createMockStats({ totalFlights: 2 });
        const saturdayLog = createMockLog({ 
            flightDate: new Date(2023, 0, 7).getTime() // January 7, 2023 was a Saturday
        });
        const sundayLog = createMockLog({ 
            flightDate: new Date(2023, 0, 8).getTime() // January 8, 2023 was a Sunday
        });
        const mockLogs: FlightLog[] = [saturdayLog, sundayLog];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toContain('weekend_warrior');
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'weekend_warrior' }));
    });

    it('should not unlock weekend_warrior with flights on Saturday only', async () => {
        const mockStats = createMockStats({ totalFlights: 2 });
        const saturdayLog1 = createMockLog({ 
            flightDate: new Date(2023, 0, 7).getTime() // Saturday
        });
        const saturdayLog2 = createMockLog({ 
            flightDate: new Date(2023, 0, 14).getTime() // Also a Saturday
        });
        const mockLogs: FlightLog[] = [saturdayLog1, saturdayLog2];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).not.toContain('weekend_warrior');
        expect(mockStore.add).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'weekend_warrior' }));
    });

    it('should unlock the location_scout achievement', async () => {
        const mockStats = createMockStats({ totalFlights: 3 });
        const log1 = createMockLog({ location: { name: 'Park A', latitude: 0, longitude: 0 } });
        const log2 = createMockLog({ location: { name: 'Park B', latitude: 0, longitude: 0 } });
        const log3 = createMockLog({ location: { name: 'Park C', latitude: 0, longitude: 0 } });
        const mockLogs: FlightLog[] = [log1, log2, log3];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toContain('location_scout');
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'location_scout' }));
    });

    it('should not unlock location_scout with fewer than 3 locations', async () => {
        const mockStats = createMockStats({ totalFlights: 3 });
        const log1 = createMockLog({ location: { name: 'Park A', latitude: 0, longitude: 0 } });
        const log2 = createMockLog({ location: { name: 'Park B', latitude: 0, longitude: 0 } });
        const log3 = createMockLog({ location: { name: 'Park A', latitude: 0, longitude: 0 } }); // Duplicate location
        const mockLogs: FlightLog[] = [log1, log2, log3];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).not.toContain('location_scout');
        expect(mockStore.add).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'location_scout' }));
    });

    it('should skip locations with null/undefined names', async () => {
        const mockStats = createMockStats({ totalFlights: 4 });
        const log1 = createMockLog({ location: { name: 'Park A', latitude: 0, longitude: 0 } });
        const log2 = createMockLog({ location: { name: 'Park B', latitude: 0, longitude: 0 } });
        const log3 = createMockLog({ location: { name: undefined, latitude: 0, longitude: 0 } });
        const log4 = createMockLog({ location: undefined }); // No location data
        const mockLogs: FlightLog[] = [log1, log2, log3, log4];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).not.toContain('location_scout');
    });

    it('should unlock the night_owl achievement', async () => {
        const mockStats = createMockStats({ totalFlights: 1 });
        const nightLog = createMockLog({ 
            flightDate: new Date().setHours(21, 0, 0, 0) // 9:00 PM
        });
        const mockLogs: FlightLog[] = [nightLog];
        
        vi.mocked(statsService.calculateAllStats).mockResolvedValue(mockStats);
        vi.mocked(flightLogService.getAllFlightLogs).mockResolvedValue(mockLogs);

        const newlyUnlocked = await checkAndUnlockAchievements();

        expect(newlyUnlocked).toContain('night_owl');
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'night_owl' }));
    });
}); 