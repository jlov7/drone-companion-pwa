// app/src/db/checklistService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
    addChecklist,
    getChecklist,
    getAllChecklists,
    updateChecklist,
    deleteChecklist,
    getChecklistTemplates,
    getChecklistsByDroneId
} from './checklistService';
import { openDB, STORE_CHECKLISTS } from './indexedDB';
import type { Checklist, ChecklistItem } from '../types/data';

// Mock the openDB function
vi.mock('./indexedDB', () => ({
    openDB: vi.fn(),
    STORE_CHECKLISTS: 'checklists',
}));

// Create mock checklist item with predictable ID option
const createChecklistItem = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
    id: `item_${overrides.id || Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Allow overriding for predictable IDs
    text: 'Sample item',
    checked: false,
    ...overrides
});

// Create mock checklist with predictable ID option
const createChecklist = (overrides: Partial<Checklist> = {}): Checklist => ({
    id: `chk_${overrides.id || Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Allow overriding for predictable IDs
    name: 'Test Checklist',
    items: [createChecklistItem({ id: 'item1'}), createChecklistItem({ id: 'item2'})], // Use predictable item IDs
    isTemplate: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    droneId: undefined,
    ...overrides
});

describe('Checklist Service', () => {
    let mockStore: any;
    let mockDb: any;
    let mockChecklists: Checklist[];

    beforeEach(() => {
        // Reset mocks
        vi.resetAllMocks();

        // Setup test data with predictable IDs
        mockChecklists = [
            createChecklist({ id: 'chk1', name: 'Pre-Flight', isTemplate: true, items: [
                createChecklistItem({ id: 'chk1-item1', text: 'Check batteries'}),
                createChecklistItem({ id: 'chk1-item2', text: 'Check propellers'})
            ]}),
            createChecklist({ id: 'chk2', name: 'Drone A Checklist', droneId: 'drone1', items: [
                createChecklistItem({ id: 'chk2-item1', text: 'Drone A Specific Check'})
            ]})
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
                    mockRequest.result = data.id || 'new-checklist-id';
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            get: vi.fn().mockImplementation(id => {
                const checklist = mockChecklists.find(c => c.id === id);
                const mockRequest = {
                    result: undefined as (Checklist | undefined),
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = checklist;
                    mockRequest.onsuccess?.();
                 }, 0);
                return mockRequest;
            }),
            getAll: vi.fn().mockImplementation(() => {
                const mockRequest = {
                    result: undefined as (Checklist[] | undefined),
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                setTimeout(() => {
                    mockRequest.result = mockChecklists;
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
            }),
            // Remove unused index/cursor mocks as service uses getAll + filter
            // index: vi.fn()... (removed implementation)
            // openCursor: vi.fn()... (removed implementation)
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
        // (openDB as MockedFunction<typeof openDB>).mockResolvedValue(mockDb as unknown as IDBDatabase);
        (openDB as MockedFunction<typeof openDB>).mockImplementation(() => Promise.resolve(mockDb as unknown as IDBDatabase));
    });

    describe('getChecklist', () => {
        it('should retrieve a checklist by ID', async () => {
            const checklist = mockChecklists[0];
            // Remove mockResolvedValueOnce
            // mockStore.get.mockResolvedValueOnce(checklist);

            const result = await getChecklist('chk1');
            
            expect(result).toEqual(checklist);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readonly');
            expect(mockStore.get).toHaveBeenCalledWith('chk1');
        });

        it('should return null for non-existent ID', async () => {
            // Remove mockResolvedValueOnce
            // mockStore.get.mockResolvedValueOnce(undefined);

            const result = await getChecklist('nonexistent');
            
            expect(result).toBeUndefined();
            expect(mockStore.get).toHaveBeenCalledWith('nonexistent');
        });
    });

    describe('addChecklist', () => {
        it('should add a new checklist', async () => {
            const checklistDataToAdd = { 
                name: 'New Checklist', 
                items: [createChecklistItem({ text: 'item1 text'})], // Let service generate ID for item
                isTemplate: false 
            };
            const id = await addChecklist(checklistDataToAdd); 

            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readwrite');
            expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ 
                name: checklistDataToAdd.name,
                // Check item structure, allowing for generated ID
                items: expect.arrayContaining([ 
                    expect.objectContaining({ 
                        text: checklistDataToAdd.items[0].text, 
                        checked: false, 
                        id: expect.any(String) // Expect any string ID
                    })
                ]),
                isTemplate: checklistDataToAdd.isTemplate,
                createdAt: expect.any(Number),
                updatedAt: expect.any(Number)
            }));
        });
    });

    describe('getAllChecklists', () => {
        it('should retrieve all checklists', async () => {
            // Remove mockResolvedValueOnce
            // mockStore.getAll.mockResolvedValueOnce(mockChecklists);

            const checklists = await getAllChecklists();
            
            expect(checklists).toEqual(mockChecklists);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readonly');
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });

    describe('updateChecklist', () => {
        it('should update an existing checklist', async () => {
            // Get the original checklist to update
            const originalChecklist: Checklist = mockChecklists.find(c => c.id === 'chk1')!;

            // Create the updated version of the checklist
            const updatedChecklistData: Checklist = {
                ...originalChecklist,
                name: 'Updated Checklist Name', // Change the name
                // Ensure timestamps are numbers for the type, updateChecklist will overwrite updatedAt
                createdAt: Number(originalChecklist.createdAt),
                updatedAt: Date.now(), // Provide a current timestamp
            };

            // Call updateChecklist with the full updated object
            await updateChecklist(updatedChecklistData);

            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readwrite');
            // Check that put was called with the updated data and a new timestamp
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                ...updatedChecklistData,
                updatedAt: expect.any(Number) // Timestamp should be updated by the service
            }));
        });

        it('should handle errors during update', async () => {
            // Data for the update attempt that will fail
            const checklistUpdateData: Checklist = {
                id: 'chk1', // ID must match an existing checklist for the update attempt
                name: 'Attempted Update Pre-Flight',
                items: [{ id: 'item1', text: 'Check Battery', checked: false }], // Added 'checked' property
                isTemplate: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Replace the faulty mock implementation
            // mockStore.put.mockImplementationOnce(() => Promise.reject(new Error('Update failed')));

            // Correctly simulate an IDBRequest that fails
            mockStore.put.mockImplementationOnce((_data: Checklist) => {
                const mockRequest = {
                    result: undefined,
                    onsuccess: null as (() => void) | null,
                    onerror: null as ((event: Event) => void) | null,
                };
                // Simulate the error callback being triggered asynchronously
                setTimeout(() => {
                    // Create a mock Event object
                    const errorEvent = new Event('error');
                    // Attach a mock error to the event target (as IDBRequest does)
                    Object.defineProperty(errorEvent, 'target', {
                        writable: false,
                        value: { error: new Error('Update failed') }
                    });
                    // Trigger the onerror handler if it has been assigned by the code under test
                    mockRequest.onerror?.(errorEvent);
                }, 0);
                return mockRequest; // Return the mock request object
            });

            // Call updateChecklist with the full object
            await expect(updateChecklist(checklistUpdateData)).rejects.toThrow('Update failed');
        });
    });

    describe('deleteChecklist', () => {
        it('should delete a checklist by ID', async () => {
            await deleteChecklist('checklist1');
            
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readwrite');
            expect(mockStore.delete).toHaveBeenCalledWith('checklist1');
        });
    });

    describe('getChecklistTemplates', () => {
        it('should retrieve all template checklists', async () => {
            const templateChecklists = mockChecklists.filter(c => c.isTemplate);

            const templates = await getChecklistTemplates();

            expect(templates).toEqual(templateChecklists);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readonly');
            // Service uses getAll and filters, so check that
            expect(mockStore.getAll).toHaveBeenCalled();
            // DO NOT check for index call:
            // expect(mockStore.index).toHaveBeenCalledWith('isTemplate_index');
        });
    });

    describe('getChecklistsByDroneId', () => {
        it('should retrieve checklists for a specific drone', async () => {
            const droneChecklists = mockChecklists.filter(c => c.droneId === 'drone1');

            const checklists = await getChecklistsByDroneId('drone1');

            expect(checklists).toEqual(droneChecklists);
            expect(mockDb.transaction).toHaveBeenCalledWith(STORE_CHECKLISTS, 'readonly');
            // Service uses getAll and filters, so check that
            expect(mockStore.getAll).toHaveBeenCalled();
            // DO NOT check for index call:
            // expect(mockStore.index).toHaveBeenCalledWith('droneId_index');
        });

        it('should return empty array if no checklists exist for a drone', async () => {

            const checklists = await getChecklistsByDroneId('nonexistent');

            expect(checklists).toEqual([]);
            // Service uses getAll and filters, so check that
            expect(mockStore.getAll).toHaveBeenCalled();
            // DO NOT check for index call:
            // expect(mockStore.index).toHaveBeenCalledWith('droneId_index');
        });
    });
}); 