// app/src/db/droneService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
    addDrone,
    getDrone,
    getAllDrones,
    updateDrone,
    deleteDrone
} from './droneService';
import { openDB, STORE_DRONES } from './indexedDB';
import type { DroneProfile } from '../types/data';

// Mock the openDB function
vi.mock('./indexedDB', () => ({
    openDB: vi.fn(),
    STORE_DRONES: 'drones',
}));

// Create a mock drone profile
const createDroneProfile = (overrides = {}): DroneProfile => ({
    id: `drone_${Date.now()}`,
    name: 'Test Drone',
    model: 'Test Model',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
});

describe('Drone Service', () => {
    let mockStore: any;
    let mockDb: any;
    let mockDrones: DroneProfile[];

    beforeEach(() => {
        // Reset mocks
        vi.resetAllMocks();
        
        // Setup test data
        mockDrones = [
            createDroneProfile({ id: 'drone1', name: 'Drone 1' }),
            createDroneProfile({ id: 'drone2', name: 'Drone 2' })
        ];

        // Create simple mock store with synchronous implementations
        mockStore = {
            add: vi.fn().mockImplementation((data) => {
                const mockRequest = {
                    result: undefined as string | undefined,
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = data.id || 'new-drone-id';
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            get: vi.fn().mockImplementation(id => {
                const drone = mockDrones.find(d => d.id === id);
                const mockRequest = {
                    result: undefined as (DroneProfile | undefined),
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = drone;
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            }),
            getAll: vi.fn().mockImplementation(() => {
                const mockRequest = {
                    result: undefined as (DroneProfile[] | undefined),
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                     mockRequest.result = mockDrones;
                     mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            }),
            put: vi.fn().mockImplementation((data) => {
                 const mockRequest = {
                    result: undefined as string | undefined,
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = data.id;
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

    describe('getDrone', () => {
        it('should retrieve a drone by ID', async () => {
            const drone = mockDrones[0];
            
            const result = await getDrone('drone1');
            
            expect(result).toEqual(drone);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_DRONES, 'readonly');
            expect(mockStore.get).toHaveBeenCalledWith('drone1');
        });

        it('should return null for non-existent ID', async () => {
            const result = await getDrone('nonexistent');
            
            expect(result).toBeUndefined();
            expect(mockStore.get).toHaveBeenCalledWith('nonexistent');
        });
    });

    describe('addDrone', () => {
        it('should add a new drone', async () => {
            const newDroneData = { name: 'New Drone', model: 'Test Model' };
            const id = await addDrone(newDroneData);

            expect(id).toEqual(expect.any(String));
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_DRONES, 'readwrite');
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({
                name: newDroneData.name,
                model: newDroneData.model,
                id: expect.any(String),
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
            }));
        });
    });

    describe('getAllDrones', () => {
        it('should retrieve all drones', async () => {
            const drones = await getAllDrones();
            
            expect(drones).toEqual(mockDrones);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_DRONES, 'readonly');
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });

    describe('updateDrone', () => {
        it('should update an existing drone', async () => {
            const droneToUpdate = { id: mockDrones[0].id, name: 'Updated Drone' };
            
            await updateDrone(droneToUpdate);
            
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_DRONES, 'readwrite');
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: droneToUpdate.id,
                name: droneToUpdate.name,
                updatedAt: expect.any(Number)
            }));
        });
    });

    describe('deleteDrone', () => {
        it('should delete a drone by ID', async () => {
            await deleteDrone('drone1');
            
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_DRONES, 'readwrite');
            expect(mockStore.delete).toHaveBeenCalledWith('drone1');
        });
    });
}); 