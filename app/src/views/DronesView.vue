<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAllDrones } from '../db/droneService';
import type { DroneProfile } from '../types/data';
import { RouterLink } from 'vue-router'; // Import RouterLink

// Reactive state
const drones = ref<DroneProfile[]>([]);
const isLoading = ref<boolean>(true);
const error = ref<string | null>(null);

// Fetch drones function
const fetchDrones = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    drones.value = await getAllDrones();
    // Optional: Sort drones, e.g., by name or creation date
    drones.value.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err: any) {
    console.error('Error fetching drones:', err);
    error.value = err.message || 'Failed to load drones.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch drones when component is mounted
onMounted(fetchDrones);
</script>

<template>
  <div class="view-container drones-view">
    <header class="view-header">
      <h1>My Drones</h1>
      <RouterLink to="/drones/add" class="btn btn-primary">Add Drone</RouterLink>
    </header>

    <div v-if="isLoading" class="loading-message">
      <p>Loading drones...</p>
      <!-- Optional: Add a spinner icon here -->
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading drones: {{ error }}</p>
      <button @click="fetchDrones" class="btn btn-secondary">Retry</button>
    </div>

    <div v-else-if="drones.length > 0" class="drone-list">
      <ul>
        <li v-for="drone in drones" :key="drone.id" class="drone-item">
          <div class="drone-info">
            <img 
                v-if="drone.imageDataUrl" 
                :src="drone.imageDataUrl" 
                alt="Drone photo" 
                class="drone-thumbnail"
            />
             <div v-else class="drone-thumbnail-placeholder">?</div> <!-- Placeholder -->
            <div>
                <span class="drone-name">{{ drone.name }}</span>
                <span v-if="drone.model" class="drone-model">({{ drone.model }})</span>
            </div>
          </div>
          <div class="drone-actions">
              <RouterLink :to="`/drones/edit/${drone.id}`" class="btn btn-sm btn-secondary">Edit</RouterLink>
              <RouterLink 
                :to="`/checklists/active/${drone.id}`" 
                class="btn btn-sm btn-success" 
                :class="{ 'disabled': !drone.defaultChecklistId }" 
                :aria-disabled="!drone.defaultChecklistId" 
                :tabindex="!drone.defaultChecklistId ? -1 : undefined"
                title="Start Pre-Flight Check (Requires Default Checklist)"
              >
                Pre-Flight
              </RouterLink>
          </div>
        </li>
      </ul>
    </div>

    <div v-else class="empty-state">
      <p>You haven't added any drones yet.</p>
      <RouterLink to="/drones/add" class="btn btn-primary">Add Your First Drone</RouterLink>
    </div>

  </div>
</template>

<style scoped>
.view-container {
  padding: 15px;
  padding-bottom: 80px; /* Ensure content above bottom nav */
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.view-header h1 {
  margin: 0;
}

/* Basic Button Styling (Consider moving to global styles) */
.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9rem;
  text-align: center;
}

.btn-primary {
  background-color: var(--primary-color, #007bff); /* Use CSS variables if defined */
  color: white;
}
.btn-primary:hover {
   background-color: var(--primary-color-dark, #0056b3);
}

.btn-secondary {
  background-color: var(--secondary-color, #6c757d);
  color: white;
}
.btn-secondary:hover {
   background-color: var(--secondary-color-dark, #545b62);
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}
.btn-danger:hover {
    background-color: #c82333;
}

.btn-success {
    background-color: #28a745;
    color: white;
}
.btn-success:hover:not(.disabled) {
    background-color: #218838;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 0.8rem;
}

.btn.disabled,
.btn:disabled {
    background-color: #6c757d; /* Use secondary color for disabled look */
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none; /* Prevents click events on RouterLink */
}

.loading-message,
.error-message,
.empty-state {
  text-align: center;
  margin-top: 30px;
  color: #666;
}

.error-message p {
  color: #dc3545;
  margin-bottom: 10px;
}

.drone-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.drone-item {
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

.drone-info {
    display: flex;
    align-items: center;
    gap: 10px; /* Space between image and text */
}

.drone-thumbnail {
    width: 40px;
    height: 40px;
    border-radius: 50%; /* Make it circular */
    object-fit: cover; /* Cover the area, cropping if needed */
    border: 1px solid #eee;
    flex-shrink: 0; /* Prevent shrinking */
}

.drone-thumbnail-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #eee;
    color: #aaa;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
    flex-shrink: 0; /* Prevent shrinking */
}

.drone-item:hover {
    background-color: var(--light-bg, #f8f9fa);
}

.drone-name {
  font-weight: bold;
}

.drone-model {
  font-size: 0.9em;
  color: #6c757d;
  margin-left: 5px;
}

.drone-actions {
    display: flex;
    gap: 5px; /* Add space between buttons */
}

.empty-state p {
    margin-bottom: 15px;
}
</style> 