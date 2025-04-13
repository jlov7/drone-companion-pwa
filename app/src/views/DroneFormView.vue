<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DroneForm from '../components/DroneForm.vue';
import { getDrone, addDrone, updateDrone } from '../db/droneService';
import type { DroneProfile } from '../types/data';

const route = useRoute();
const router = useRouter();

// State
const drone = ref<DroneProfile | Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const isSaving = ref<boolean>(false); // For showing saving indicator

// Determine mode (add or edit) and drone ID from route params
const isEditMode = computed(() => !!route.params.id);
const droneId = computed(() => route.params.id as string | undefined);

// Fetch drone data if in edit mode
onMounted(async () => {
  if (isEditMode.value && droneId.value) {
    isLoading.value = true;
    error.value = null;
    try {
      const fetchedDrone = await getDrone(droneId.value);
      if (fetchedDrone) {
        drone.value = fetchedDrone;
      } else {
        error.value = 'Drone not found.';
        // Optionally redirect or show a specific message
        console.warn(`Drone with ID ${droneId.value} not found.`);
      }
    } catch (err: any) {
      console.error('Error fetching drone for edit:', err);
      error.value = err.message || 'Failed to load drone data.';
    } finally {
      isLoading.value = false;
    }
  } else {
    // Initialize for add mode (optional, DroneForm handles defaults)
    drone.value = { name: '', model: '', notes: '' };
  }
});

// Handle save event from DroneForm
const handleSaveDrone = async (droneData: Omit<DroneProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
  isSaving.value = true;
  error.value = null;
  try {
    await addDrone(droneData);
    router.push('/drones'); // Redirect to list after successful save
  } catch (err: any) {
    console.error('Error adding drone:', err);
    error.value = err.message || 'Failed to save drone.';
    isSaving.value = false; // Stop saving indicator on error
  }
  // No finally here, keep saving indicator until navigation or error
};

// Handle update event from DroneForm
const handleUpdateDrone = async (droneData: Partial<DroneProfile> & { id: string }) => {
  isSaving.value = true;
  error.value = null;
  try {
    await updateDrone(droneData);
    router.push('/drones'); // Redirect to list after successful update
  } catch (err: any) {
    console.error('Error updating drone:', err);
    error.value = err.message || 'Failed to update drone.';
    isSaving.value = false; // Stop saving indicator on error
  }
   // No finally here, keep saving indicator until navigation or error
};

</script>

<template>
  <div class="view-container drone-form-view">
    <div v-if="isLoading" class="loading-message">
      <p>Loading drone data...</p>
    </div>
    <div v-else-if="error && !isSaving" class="error-message">
      <p>Error: {{ error }}</p>
       <RouterLink to="/drones" class="btn btn-secondary">Back to List</RouterLink>
    </div>
    <!-- Render form if not loading initial data OR if an error occurred during save/update -->
    <DroneForm
      v-else
      :initial-data="drone ? drone : undefined"
      :is-edit-mode="isEditMode"
      @save="handleSaveDrone"
      @update="handleUpdateDrone"
    />
    <!-- Display saving/error message overlay -->
     <div v-if="isSaving || (error && !isLoading)" class="status-overlay">
        <div v-if="isSaving" class="saving-message">
            <p>Saving...</p>
            <!-- Optional spinner -->
        </div>
         <div v-if="error && !isLoading" class="error-message-overlay">
            <p>Error: {{ error }}</p>
            <button @click="error = null; isSaving = false" class="btn btn-secondary">Dismiss</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 15px;
  padding-bottom: 80px; /* Ensure content above bottom nav */
}

.loading-message,
.error-message {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.error-message p {
  color: #dc3545;
  margin-bottom: 15px;
}

.status-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top */
}

.saving-message,
.error-message-overlay {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.error-message-overlay p {
    color: #dc3545;
    margin-bottom: 15px;
}

/* Assume .btn styles are available */
</style> 