<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { DroneProfile, Checklist } from '../types/data';
import { getAllChecklists } from '../db/checklistService'; // Import checklist service

// Props
const props = defineProps<{
  initialData?: Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'> | DroneProfile; // Allow full profile for edit
  isEditMode: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'save', droneData: Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'>): void; // Data for adding
  (e: 'update', droneData: Partial<DroneProfile> & { id: string }): void; // Data for updating
}>();

// Router for navigation
const router = useRouter();

// Checklist state
const availableChecklists = ref<Checklist[]>([]);
const isLoadingChecklists = ref(false);

// Image state
const imagePreviewUrl = ref<string | null>(null);
const imageError = ref<string | null>(null);

// Form state
// Add imageDataUrl to the form state
const formData = ref<Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>>({
    name: '',
    model: '',
    notes: '',
    defaultChecklistId: undefined, // Use undefined instead of null
    imageDataUrl: undefined, // Add image data URL field
});
const droneIdToUpdate = ref<string | null>(null);

// Fetch available checklists (templates or general ones)
onMounted(async () => {
    isLoadingChecklists.value = true;
    try {
        const allChecklists = await getAllChecklists();
        // Filter for checklists that can be assigned (templates or non-drone-specific ones)
        // Or potentially show all? Let's show all for now, user can decide.
        availableChecklists.value = allChecklists;
    } catch (error) {
        console.error("Failed to load checklists for dropdown:", error);
        // Handle error appropriately (e.g., show message to user)
    } finally {
        isLoadingChecklists.value = false;
    }
});

// Watch for changes in initialData to populate the form
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value.name = newData.name || '';
    formData.value.model = newData.model || '';
    formData.value.notes = newData.notes || '';
    formData.value.defaultChecklistId = newData.defaultChecklistId || undefined; // Use undefined
    formData.value.imageDataUrl = newData.imageDataUrl || undefined; // Populate image data URL
    imagePreviewUrl.value = newData.imageDataUrl || null; // Set initial image preview

    // If it's a full profile (edit mode), store the ID
    if ('id' in newData) {
        droneIdToUpdate.value = newData.id;
    } else {
        droneIdToUpdate.value = null; // Reset if switching from edit to add (though unlikely via prop change)
    }
  } else {
    // Reset form if initialData becomes null/undefined (e.g., navigating to add)
    formData.value.name = '';
    formData.value.model = '';
    formData.value.notes = '';
    formData.value.defaultChecklistId = undefined; // Reset checklist ID to undefined
    formData.value.imageDataUrl = undefined; // Reset image data URL
    imagePreviewUrl.value = null; // Clear image preview
    droneIdToUpdate.value = null;
  }
}, { immediate: true }); // immediate: true to run on initial mount

// Image handling function
const handleImageUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    imageError.value = null; // Clear previous errors

    if (file) {
        // Basic validation (type and size)
        if (!file.type.startsWith('image/')) {
            imageError.value = 'Please select an image file (e.g., JPG, PNG, GIF).';
            resetImageInput(target);
            return;
        }
        // Limit size (e.g., 2MB) - adjust as needed
        const maxSizeMB = 2;
        if (file.size > maxSizeMB * 1024 * 1024) {
            imageError.value = `Image size should not exceed ${maxSizeMB}MB.`;
            resetImageInput(target);
            return;
        }

        // Read file as Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            formData.value.imageDataUrl = result;
            imagePreviewUrl.value = result;
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            imageError.value = 'Failed to read image file.';
            resetImageInput(target);
        };
        reader.readAsDataURL(file);
    }
};

// Helper to clear file input and preview
const clearImage = (inputElementId = 'drone-image') => {
    formData.value.imageDataUrl = undefined;
    imagePreviewUrl.value = null;
    imageError.value = null;
    const input = document.getElementById(inputElementId) as HTMLInputElement;
    if (input) {
        input.value = ''; // Clear the file input visually
    }
};

// Helper to reset the input field if validation fails
const resetImageInput = (inputElement: HTMLInputElement) => {
    inputElement.value = ''; // Clear the selected file
    formData.value.imageDataUrl = undefined;
    imagePreviewUrl.value = null;
}

// Form validation (simple example)
const isNameValid = computed(() => formData.value.name.trim().length > 0);
const canSubmit = computed(() => isNameValid.value);

// Form submission handler
const handleSubmit = () => {
  if (!canSubmit.value) return;

  if (props.isEditMode && droneIdToUpdate.value) {
    // Emit data for update, including the ID
    emit('update', { id: droneIdToUpdate.value, ...formData.value });
  } else {
    // Emit data for save (add)
    emit('save', { ...formData.value });
  }
};

// Cancel handler
const handleCancel = () => {
  router.push('/drones'); // Navigate back to the drone list
};

</script>

<template>
  <form @submit.prevent="handleSubmit" class="drone-form">
    <h2>{{ isEditMode ? 'Edit Drone' : 'Add New Drone' }}</h2>

    <div class="form-group">
      <label for="drone-name">Drone Name *</label>
      <input
        id="drone-name"
        v-model.trim="formData.name"
        type="text"
        required
        placeholder="e.g., My Mavic Mini"
      />
      <span v-if="!isNameValid && formData.name.length > 0" class="error-text">Name is required.</span>
    </div>

    <div class="form-group">
      <label for="drone-model">Model (Optional)</label>
      <input
        id="drone-model"
        v-model.trim="formData.model"
        type="text"
        placeholder="e.g., DJI Mini 3 Pro"
      />
    </div>

    <!-- Image Upload -->
    <div class="form-group">
        <label for="drone-image">Drone Photo (Optional)</label>
        <input
            type="file"
            id="drone-image"
            accept="image/*" 
            @change="handleImageUpload"
        />
         <!-- Image Preview -->
        <div v-if="imagePreviewUrl" class="image-preview-container">
            <img :src="imagePreviewUrl" alt="Drone preview" class="image-preview" />
            <button type="button" @click="clearImage()" class="btn btn-secondary btn-sm clear-image-btn">Clear Image</button>
        </div>
         <small v-if="imageError" class="error-text">{{ imageError }}</small>
         <small class="form-text text-muted">Upload a photo of your drone (Max 2MB).</small>
    </div>

    <div class="form-group">
      <label for="drone-notes">Notes (Optional)</label>
      <textarea
        id="drone-notes"
        v-model="formData.notes"
        rows="4"
        placeholder="Any specific details about this drone..."
      ></textarea>
    </div>

    <!-- Checklist Selection -->
    <div class="form-group">
        <label for="drone-checklist">Default Checklist (Optional)</label>
        <select 
            id="drone-checklist" 
            v-model="formData.defaultChecklistId" 
            :disabled="isLoadingChecklists"
        >
            <option :value="undefined">-- None --</option>
            <option v-if="isLoadingChecklists" disabled>Loading checklists...</option>
            <template v-else>
                <option v-for="checklist in availableChecklists" :key="checklist.id" :value="checklist.id">
                    {{ checklist.name }} {{ checklist.isTemplate ? '(Template)' : '' }}
                </option>
            </template>
        </select>
        <!-- Optional: Add hint text -->
        <small class="form-text text-muted">Select a checklist to use by default for pre-flight checks with this drone.</small>
    </div>

    <div class="form-actions">
      <button type="button" @click="handleCancel" class="btn btn-secondary">Cancel</button>
      <button type="submit" :disabled="!canSubmit" class="btn btn-primary">
        {{ isEditMode ? 'Update Drone' : 'Save Drone' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.drone-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 500px; /* Limit form width */
  margin: 20px auto; /* Center form */
}

h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Include padding and border in element's total width and height */
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical; /* Allow vertical resizing */
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--primary-color, #007bff);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.error-text {
    color: #dc3545;
    font-size: 0.8em;
    display: block;
    margin-top: 4px;
}

.form-group select[disabled] {
    background-color: #e9ecef;
    cursor: not-allowed;
}

.form-text {
    font-size: 0.85em;
    color: #6c757d; /* Bootstrap muted color */
    display: block;
    margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  gap: 10px; /* Space between buttons */
  margin-top: 25px;
}

/* Using button styles defined in DronesView for consistency */
/* Assume .btn, .btn-primary, .btn-secondary are globally available or scoped */
/* Adjust button styling if needed */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  text-align: center;
}

.btn-primary {
  background-color: var(--primary-color, #007bff);
  color: white;
}
.btn-primary:hover:not(:disabled) {
   background-color: var(--primary-color-dark, #0056b3);
}
.btn-primary:disabled {
    background-color: #a1cfff;
    cursor: not-allowed;
}


.btn-secondary {
  background-color: var(--secondary-color, #6c757d);
  color: white;
  border: 1px solid var(--secondary-color, #6c757d); /* Add border for contrast */
}
.btn-secondary:hover {
   background-color: var(--secondary-color-dark, #545b62);
   border-color: var(--secondary-color-dark, #545b62);
}

/* Responsive adjustments if needed */
@media (max-width: 600px) {
  .drone-form {
    margin: 10px;
    padding: 15px;
  }
  .form-actions {
    flex-direction: column-reverse; /* Stack buttons on small screens */
    gap: 15px;
  }
  .form-actions button {
    width: 100%; /* Make buttons full width */
  }
}

.image-preview-container {
    margin-top: 15px;
    position: relative; /* For positioning the clear button */
    max-width: 200px; /* Limit preview size */
}

.image-preview {
    max-width: 100%;
    max-height: 150px; /* Limit preview height */
    border: 1px solid #ddd;
    border-radius: 4px;
    display: block;
}

.clear-image-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0.8;
}

.clear-image-btn:hover {
    opacity: 1;
}

input[type="file"] {
    display: block;
    margin-top: 5px;
    font-size: 0.9em; 
}
</style> 