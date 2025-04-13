import type { Checklist, ChecklistItem } from '../types/data';

// Define the structure for a default template (without IDs, timestamps)
type DefaultChecklistTemplate = Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'droneId'> & {
    items: Omit<ChecklistItem, 'id' | 'checked'>[]; // Items only need text initially
};

export const DEFAULT_PRE_FLIGHT_CHECKLIST: DefaultChecklistTemplate = {
    name: 'Default Pre-Flight',
    isTemplate: true,
    items: [
        { text: 'Check battery levels (drone and controller)' },
        { text: 'Inspect propellers for damage' },
        { text: 'Check gimbal and camera lens' },
        { text: 'Ensure SD card is inserted and has space' },
        { text: 'Check weather conditions' },
        { text: 'Verify GPS signal lock' },
        { text: 'Set Return-to-Home (RTH) altitude' },
        { text: 'Clear takeoff/landing area' },
        { text: 'Check local airspace regulations/restrictions' },
        { text: 'Visual line of sight check' },
    ]
};

export const DEFAULT_POST_FLIGHT_CHECKLIST: DefaultChecklistTemplate = {
    name: 'Default Post-Flight',
    isTemplate: true,
    items: [
        { text: 'Inspect drone for any damage' },
        { text: 'Clean camera lens and sensors' },
        { text: 'Remove and store battery safely' },
        { text: 'Backup footage from SD card' },
        { text: 'Charge batteries if needed for next flight' },
        { text: 'Log flight details' },
    ]
};

// Array of all default templates
export const ALL_DEFAULT_CHECKLISTS: DefaultChecklistTemplate[] = [
    DEFAULT_PRE_FLIGHT_CHECKLIST,
    DEFAULT_POST_FLIGHT_CHECKLIST
];

// Unique identifiers for checking if defaults exist (can use name or a predefined ID)
export const DEFAULT_PRE_FLIGHT_ID_MARKER = 'default_pre_flight_v1';
export const DEFAULT_POST_FLIGHT_ID_MARKER = 'default_post_flight_v1';

// Function to adapt template to the format needed by addChecklist
// We'll add a marker ID here temporarily for the check, addChecklist will generate real IDs
export const adaptTemplateForStorage = (
    template: DefaultChecklistTemplate,
    markerId: string
): Omit<Checklist, 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<ChecklistItem, 'id'>[] } => {
     // Map items to include 'checked: false'
    const itemsForDb = template.items.map(item => ({
        text: item.text,
        checked: false // Add the required checked property
    }));

    return {
        id: markerId, // Use marker ID for the check
        name: template.name,
        isTemplate: template.isTemplate,
        droneId: null, // Templates are not linked to specific drones
        items: itemsForDb,
    };
}; 