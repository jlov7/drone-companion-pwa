<template>
  <div class="view-container checklist-management">
    <header class="view-header">
      <h1>Checklists</h1>
      <button @click="openAddModal" class="btn btn-primary">+ Add Checklist</button>
    </header>

    <div v-if="isLoading" class="loading-indicator">
      Loading checklists...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <ul v-else-if="checklists.length > 0" class="checklist-list">
      <li v-for="checklist in checklists" :key="checklist.id" class="checklist-item">
        <div class="checklist-info">
          <span class="checklist-name">{{ checklist.name }}</span>
          <span class="checklist-type">({{ checklist.isTemplate ? 'Template' : (checklist.droneId ? 'Drone Specific' : 'General') }})</span>
        </div>
        <div class="checklist-actions">
          <button @click="openEditModal(checklist)" class="btn btn-secondary btn-sm">Edit</button>
          <button @click="confirmDelete(checklist)" class="btn btn-danger btn-sm" :disabled="isDefault(checklist.id)">Delete</button>
        </div>
      </li>
    </ul>

    <p v-else class="empty-state">No checklists found. Add one to get started!</p>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Edit Checklist' : 'Add New Checklist' }}</h2>
        <form @submit.prevent="handleFormSubmit">
          <div class="form-group">
            <label for="checklist-name">Name:</label>
            <input type="text" id="checklist-name" v-model="currentChecklist.name" required>
          </div>

          <div class="form-group checkbox-group">
              <input type="checkbox" id="checklist-isTemplate" v-model="currentChecklist.isTemplate">
              <label for="checklist-isTemplate">Is Template?</label>
          </div>

          <!-- Checklist Items -->
          <div class="form-group">
            <label>Checklist Items:</label>
            <ul class="checklist-items-edit">
              <li v-for="(item, index) in currentChecklist.items" :key="item.id || index">
                <input type="text" v-model="item.text" placeholder="Item description" required>
                <button type="button" @click="removeItem(index)" class="btn btn-danger btn-xs">X</button>
              </li>
            </ul>
            <button type="button" @click="addItem" class="btn btn-secondary btn-sm">+ Add Item</button>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ isEditing ? 'Save Changes' : 'Add Checklist' }}</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
    getAllChecklists, 
    addChecklist, 
    updateChecklist, 
    deleteChecklist,
    ensureDefaultChecklists,
    getChecklist
} from '../db/checklistService';
import type { Checklist, ChecklistItem } from '../types/data';
import { 
    DEFAULT_PRE_FLIGHT_ID_MARKER, 
    DEFAULT_POST_FLIGHT_ID_MARKER 
} from '../config/defaultChecklists'; // Import default markers


const checklists = ref<Checklist[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showModal = ref(false);
const isEditing = ref(false);

// Use Omit for adding/editing to avoid passing readonly properties like createdAt/updatedAt
const initialChecklistState: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    isTemplate: false,
    droneId: null,
    items: [{ text: '', checked: false, id: `temp_${Date.now()}` }], // Start with one empty item, temporary ID for key
};

// We need a slightly different type for the form model because items might lack IDs temporarily
interface ChecklistFormData {
    id?: string; // Only present when editing
    name: string;
    isTemplate: boolean;
    droneId?: string | null;
    items: Array<Partial<ChecklistItem> & { text: string }>; // Items might lack 'id' and 'checked' initially
}

const currentChecklist = ref<ChecklistFormData>({ ...initialChecklistState, items: [{ text: '' }] });

const fetchChecklists = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Ensure default checklists are present before fetching all
    await ensureDefaultChecklists(); 
    checklists.value = await getAllChecklists();
  } catch (err) {
    console.error("Error fetching checklists:", err);
    error.value = "Failed to load checklists. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Generate temporary ID for v-for key in modal
const generateTempItemId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const openAddModal = () => {
  isEditing.value = false;
  currentChecklist.value = { 
      ...initialChecklistState, 
      items: [{ text: '' }] // Reset with one empty item
  };
  showModal.value = true;
};

const openEditModal = (checklist: Checklist) => {
  isEditing.value = true;
  // Deep copy to avoid modifying the original list data directly
  currentChecklist.value = JSON.parse(JSON.stringify(checklist)); 
  if (currentChecklist.value.items.length === 0) {
      // Ensure there's always at least one item field for editing
      addItem(); 
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentChecklist.value = { ...initialChecklistState, items: [{ text: '' }] }; // Reset form
};

const addItem = () => {
  // Use partial item type here as we only need 'text'
  // Also add checked: false explicitly
  currentChecklist.value.items.push({ text: '', id: generateTempItemId(), checked: false }); 
};

const removeItem = (index: number) => {
  currentChecklist.value.items.splice(index, 1);
};

const handleFormSubmit = async () => {
    // Validate Name
    const checklistName = currentChecklist.value.name.trim();
    if (!checklistName) {
        alert("Please enter a name for the checklist.");
        return;
    }

    // Validate and prepare items
    const finalItems: ChecklistItem[] = currentChecklist.value.items
        .map(item => ({ 
            // Ensure all required fields are present and text is trimmed
            id: item.id || generateTempItemId(), // Keep existing ID or temp ID
            text: item.text.trim(), 
            checked: typeof item.checked === 'boolean' ? item.checked : false // Default checked to false if missing
        }))
        .filter(item => item.text !== ''); // Filter out items with empty text

    if (finalItems.length === 0) {
        alert("Please add at least one valid checklist item.");
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        if (isEditing.value && currentChecklist.value.id) {
            // --- UPDATE ---
            // Fetch the original checklist to preserve createdAt and potentially other non-form fields
            const originalChecklist = await getChecklist(currentChecklist.value.id);
            if (!originalChecklist) {
                throw new Error("Original checklist not found for update.");
            }

            const checklistToUpdate: Checklist = {
                // Spread original data first
                ...originalChecklist,
                // Then overwrite with values from the form
                id: currentChecklist.value.id, // Ensure ID is present
                name: checklistName,
                isTemplate: currentChecklist.value.isTemplate,
                droneId: currentChecklist.value.droneId,
                items: finalItems, // Use the validated & filtered items from the form
                createdAt: originalChecklist.createdAt, // Preserve original creation timestamp
                updatedAt: Date.now() // Set update timestamp
            };

            console.log("Updating checklist:", JSON.stringify(checklistToUpdate, null, 2));
            await updateChecklist(checklistToUpdate);
            console.log("Update successful.");

        } else {
            // --- ADD ---
            const itemsForAdd: Omit<ChecklistItem, 'id'>[] = finalItems.map(item => ({ 
                text: item.text, 
                checked: item.checked // Pass the checked status (should be false for new items)
            }));

            // Correct type annotation to match addChecklist service signature
            const checklistData: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<ChecklistItem, 'id'>[] } = {
                name: checklistName,
                isTemplate: currentChecklist.value.isTemplate,
                droneId: currentChecklist.value.isTemplate ? null : currentChecklist.value.droneId,
                items: itemsForAdd // Use the correctly mapped items array
            };
            console.log("Adding checklist:", JSON.stringify(checklistData, null, 2));
            await addChecklist(checklistData);
            console.log("Add successful.");
        }

        closeModal();
        await fetchChecklists(); // Refresh list
    } catch (err) {
        console.error("Error saving checklist:", err);
        error.value = `Failed to save checklist: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
        isLoading.value = false;
    }
};

const confirmDelete = async (checklist: Checklist) => {
  if (isDefault(checklist.id)) {
      alert("Default checklists cannot be deleted.");
      return;
  }
  if (window.confirm(`Are you sure you want to delete the checklist "${checklist.name}"? This cannot be undone.`)) {
    isLoading.value = true;
    error.value = null;
    try {
      await deleteChecklist(checklist.id);
      await fetchChecklists(); // Refresh list
    } catch (err) {
      console.error("Error deleting checklist:", err);
      error.value = "Failed to delete checklist. Please try again.";
    } finally {
        isLoading.value = false;
    }
  }
};

// Helper to check if a checklist is one of the defaults
const isDefault = (id: string): boolean => {
    return id === DEFAULT_PRE_FLIGHT_ID_MARKER || id === DEFAULT_POST_FLIGHT_ID_MARKER;
};

// Fetch checklists when component is mounted
onMounted(() => {
  fetchChecklists();
});

</script>

<style scoped>
/* Add styles similar to DronesView for consistency */
.view-container {
  padding: 1rem;
  padding-bottom: 80px; /* Ensure space for bottom nav */
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.checklist-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.checklist-item {
  background-color: #fff;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease; /* Add transition */
}

.checklist-item:hover {
    background-color: var(--light-bg, #f8f9fa);
}

.checklist-info {
  flex-grow: 1;
  margin-right: 1rem;
}

.checklist-name {
  font-weight: bold;
  display: block;
}

.checklist-type {
  font-size: 0.85em;
  color: #666;
}

.checklist-actions .btn {
  margin-left: 0.5rem;
}

.loading-indicator,
.error-message,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  color: #dc3545; /* Bootstrap danger color */
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 1rem;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Include padding in width */
}

.checkbox-group {
    display: flex;
    align-items: center;
}

.checkbox-group input[type="checkbox"] {
    margin-right: 0.5rem;
}

.checklist-items-edit {
    list-style: none;
    padding: 0;
    margin-top: 0.5rem;
    max-height: 200px; /* Limit height and make scrollable */
    overflow-y: auto;
    border: 1px solid #eee;
    padding: 0.5rem;
    border-radius: 4px;
}

.checklist-items-edit li {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.checklist-items-edit li input[type="text"] {
    flex-grow: 1;
    margin-right: 0.5rem;
}

.btn-xs {
    padding: 0.2rem 0.4rem;
    font-size: 0.8em;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Basic Button Styles (adjust as needed) */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #007aff;
  color: white;
}

.btn-secondary {
  background-color: #e5e5ea;
  color: #007aff;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.9em;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.7;
}

</style> 