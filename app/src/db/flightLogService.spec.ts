import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
    addFlightLog,
    getFlightLog,
    getAllFlightLogs,
    updateFlightLog,
    deleteFlightLog
} from './flightLogService';
import { openDB, STORE_FLIGHT_LOGS } from './indexedDB';
import type { FlightLog } from '../types/data';

// Mock the openDB function
vi.mock('./indexedDB', () => ({
    openDB: vi.fn(),
    STORE_FLIGHT_LOGS: 'flightLogs',
}));

// Removed unused createFlightLog function
// const createFlightLog = (overrides = {}): FlightLog => ({
//     id: `log_${Date.now()}`,
//     droneId: 'drone1',
//     droneName: 'Test Drone',
//     flightDate: Date.now(),
//     durationMinutes: 10,
//     createdAt: Date.now(),
//     updatedAt: Date.now(),
//     ...overrides
// });

describe('Flight Log Service', () => {
    let mockStore: any;
    let mockDb: any;
    let mockLogs: FlightLog[];

    beforeEach(() => {
        // Reset mocks
        vi.resetAllMocks();
        
        // Setup test data
        mockLogs = [
            {
                id: 'log1',
                droneId: 'drone1',
                droneName: 'Test Drone',
                flightDate: Date.now() - 86400000 * 2, // 2 days ago
                durationMinutes: 10,
                location: { name: 'Park', latitude: 40.7128, longitude: -74.0060 }, // Correct location structure
                weather: { condition: 'sunny', temperature: 25 }, // Use lowercase condition
                createdAt: Date.now() - 86400000 * 2,
                updatedAt: Date.now() - 86400000 * 2
            },
            {
                id: 'log2',
                droneId: 'drone2',
                droneName: 'Another Drone',
                flightDate: Date.now() - 86400000, // 1 day ago
                durationMinutes: 20,
                location: { name: 'Field' }, 
                weather: { condition: 'cloudy' }, // Use lowercase condition
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000
            }
        ];

        // Create simple mock store with synchronous implementations
        mockStore = {
            add: vi.fn().mockImplementation((data) => {
                const mockRequest = {
                    result: undefined as string | undefined, // Initialize result
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = data.id || 'new-log-id'; // Set result before onsuccess
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            get: vi.fn().mockImplementation(id => {
                const log = mockLogs.find(l => l.id === id);
                const mockRequest = {
                    result: undefined as (FlightLog | undefined), // Initialize result
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = log; // Set result before onsuccess
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            getAll: vi.fn().mockImplementation(() => {
                const mockRequest = {
                    result: undefined as (FlightLog[] | undefined), // Initialize result
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = mockLogs; // Set result before onsuccess
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            put: vi.fn().mockImplementation((data) => {
                 const mockRequest = {
                    result: undefined as string | undefined, // Initialize result
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = data.id; // Set result before onsuccess
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            delete: vi.fn().mockImplementation((_idToDelete) => {
                 const mockRequest = {
                    result: undefined,
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => { mockRequest.onsuccess?.(); }, 0);
                return mockRequest;
            })
            // Add cursor simulation if needed for sorted getAll
            // openCursor: vi.fn().mockImplementation(() => { /* ... cursor simulation ... */ })
        };

        // Create simple mock transaction
        const mockTransaction = {
            objectStore: vi.fn().mockReturnValue(mockStore)
        };

        // Create simple mock DB
        mockDb = {
            transaction: vi.fn().mockReturnValue(mockTransaction)
        };

        // Configure openDB mock more explicitly
        (openDB as MockedFunction<typeof openDB>).mockImplementation(() => Promise.resolve(mockDb as unknown as IDBDatabase));
    });

    describe('getFlightLog', () => {
        it('should retrieve a flight log by ID', async () => {
            const log = mockLogs[0];
            
            const result = await getFlightLog('log1');
            
            expect(result).toEqual(log);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readonly');
            expect(mockStore.get).toHaveBeenCalledWith('log1');
        });

        it('should return null for non-existent ID', async () => {
            const result = await getFlightLog('nonexistent');
            
            expect(result).toBeUndefined();
            expect(mockStore.get).toHaveBeenCalledWith('nonexistent');
        });
    });

    describe('addFlightLog', () => {
        it('should add a new flight log', async () => {
            // Provide a more complete FlightLog object using the helper
            const logDataToAdd = {
                droneId: 'drone1',
                droneName: 'Drone 1', // Need drone name
                flightDate: Date.now(),
                durationMinutes: 15,
                // Add other required or typical fields if necessary based on FlightLog type
            };
            // `id` will be generated by the service, but we can define one for the helper
            // Removed unused newLog assignment
            // const newLog = createFlightLog({ id: 'new-log-id-temp', ...logDataToAdd }); 

            // Adjust expectation based on mockImplementation and service logic
            // The service generates its own ID, which the mock resolves
            const id = await addFlightLog(logDataToAdd); // Pass data without id

            expect(id).toBeDefined(); // Service generates ID
            expect(typeof id).toBe('string'); // Should be a string ID
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readwrite');
            // Check data passed to store, ensuring timestamps were added
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ 
                droneId: logDataToAdd.droneId,
                flightDate: logDataToAdd.flightDate,
                durationMinutes: logDataToAdd.durationMinutes,
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
             }));
        });

        it('should add a flight log with correct data structure', async () => {
            const logDataToAdd: Omit<FlightLog, 'id' | 'createdAt' | 'updatedAt'> = {
                droneId: 'drone1',
                droneName: 'Drone One',
                flightDate: Date.now(),
                durationMinutes: 15,
                location: { name: 'Test Park' },
                weather: { condition: 'sunny' }
            };

            await addFlightLog(logDataToAdd);

            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
                ...logDataToAdd,
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
            }));
        });
    });

    describe('getAllFlightLogs', () => {
        it('should retrieve all flight logs', async () => {
            const logs = await getAllFlightLogs();
            
            expect(logs).toEqual(mockLogs);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readonly');
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should sort logs by date when sortByDateDesc is true', async () => {
            const sortedLogs = [...mockLogs].sort((a, b) => b.flightDate - a.flightDate);
            
            const logs = await getAllFlightLogs(true);
            
            expect(logs).toEqual(sortedLogs);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readonly');
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });

    describe('updateFlightLog', () => {
        it('should update an existing flight log', async () => {
            const logUpdateData = { id: mockLogs[0].id, notes: 'Updated notes' }; 

            await updateFlightLog(logUpdateData);

            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readwrite');
            // Assert that put was called with the full merged object structure
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                // Fields from original log (mockLogs[0])
                id: mockLogs[0].id,
                droneId: mockLogs[0].droneId,
                droneName: mockLogs[0].droneName, 
                flightDate: mockLogs[0].flightDate,
                durationMinutes: mockLogs[0].durationMinutes,
                location: mockLogs[0].location, 
                weather: mockLogs[0].weather,       
                createdAt: mockLogs[0].createdAt, // Add createdAt from original
                // Updated fields
                notes: logUpdateData.notes,          
                updatedAt: expect.any(Number) 
            }));
        });
    });

    describe('deleteFlightLog', () => {
        it('should delete a flight log by ID', async () => {
            await deleteFlightLog('log1');
            
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_FLIGHT_LOGS, 'readwrite');
            expect(mockStore.delete).toHaveBeenCalledWith('log1');
        });
    });
}); 