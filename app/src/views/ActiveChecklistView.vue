<template>
  <div class="view-container active-checklist-view">
    <header class="view-header">
      <!-- Back button -->
      <button @click="goBack" class="btn btn-secondary btn-sm">&lt; Back</button>
      <h1>Pre-Flight Checklist</h1>
      <div class="header-placeholder"></div> <!-- Placeholder for alignment -->
    </header>

    <div v-if="isLoading" class="loading-message">
      Loading checklist...
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-else-if="drone && checklist" class="checklist-content">
      <h2>{{ drone.name }} - {{ checklist.name }}</h2>
      <p v-if="checklist.items.length === 0" class="empty-state">This checklist has no items.</p>
      <ul v-else class="checklist-items">
        <li v-for="item in checklist.items" :key="item.id">
          <label :class="{ 'item-checked': itemStates[item.id] }">
            <input 
              type="checkbox" 
              :id="`item-${item.id}`" 
              :name="`item-${item.id}`"
              v-model="itemStates[item.id]" 
            />
            <span>{{ item.text }}</span>
          </label>
        </li>
      </ul>
      <!-- Button to start log -->
      <div class="start-log-action">
        <button 
          @click="startFlightLog"
          :disabled="!isChecklistComplete"
          class="btn btn-primary btn-lg"
        >
          {{ isChecklistComplete ? 'Start Flight Log' : 'Complete Checklist First' }}
        </button>
      </div>
    </div>
    <div v-else class="error-message">
        Checklist not found or drone has no default checklist assigned.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getDrone } from '../db/droneService';
import { getChecklist } from '../db/checklistService';
import type { DroneProfile, Checklist } from '../types/data';

// Props passed from router (droneId)
const props = defineProps<{
  droneId: string;
}>();

const router = useRouter();

const drone = ref<DroneProfile | null>(null);
const checklist = ref<Checklist | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// State for checklist item checked status
const itemStates = ref<Record<string, boolean>>({});

// Computed property to check if all items are checked
const isChecklistComplete = computed(() => {
    if (!checklist.value || checklist.value.items.length === 0) {
        return false; // Cannot complete an empty or non-existent checklist
    }
    // Check if every item ID in the checklist exists as a key in itemStates and is true
    return checklist.value.items.every(item => itemStates.value[item.id] === true);
});

const fetchChecklistData = async () => {
  isLoading.value = true;
  error.value = null;
  checklist.value = null; // Reset checklist
  drone.value = null; // Reset drone
  itemStates.value = {}; // Reset item states

  if (!props.droneId) {
    error.value = "No drone ID provided.";
    isLoading.value = false;
    return;
  }

  try {
    // 1. Fetch the drone profile
    const fetchedDrone = await getDrone(props.droneId);
    if (!fetchedDrone) {
      error.value = `Drone with ID ${props.droneId} not found.`;
      isLoading.value = false;
      return;
    }
    drone.value = fetchedDrone;

    // 2. Check if the drone has a default checklist assigned
    if (!fetchedDrone.defaultChecklistId) {
      error.value = `Drone "${fetchedDrone.name}" does not have a default checklist assigned. Please assign one in the drone settings.`;
      isLoading.value = false;
      return;
    }

    // 3. Fetch the assigned checklist
    const fetchedChecklist = await getChecklist(fetchedDrone.defaultChecklistId);
    if (!fetchedChecklist) {
      error.value = `Assigned checklist (ID: ${fetchedDrone.defaultChecklistId}) could not be found.`;
       // Optionally suggest assigning a different checklist?
    } else {
        checklist.value = fetchedChecklist;
        // Initialize itemStates based on the fetched checklist
        // Start all items as unchecked for this interaction
        itemStates.value = fetchedChecklist.items.reduce((acc, item) => {
            acc[item.id] = false; // Initialize all as unchecked
            return acc;
        }, {} as Record<string, boolean>);
    }

  } catch (err) {
    console.error("Error loading active checklist data:", err);
    error.value = `Failed to load checklist data: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
    router.back(); // Go back to the previous view (likely DronesView)
};

// Navigate to the Add Flight Log screen
const startFlightLog = () => {
    if (!isChecklistComplete.value || !drone.value || !checklist.value) {
        console.warn("Attempted to start flight log when checklist is not complete or data is missing.");
        return; // Should not be possible due to button disable, but good practice
    }
    // Navigate to the add log form, passing droneId and checklistId as query params
    router.push({
        name: 'AddFlightLog', // Use the route name defined in router.ts
        query: {
            droneId: drone.value.id,
            checklistId: checklist.value.id
        }
    });
};

// Fetch data when component mounts
onMounted(() => {
  fetchChecklistData();
});

</script>

<style scoped>
.view-container {
  padding: 1rem;
  padding-bottom: 80px; /* Space for bottom nav if applicable */
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.view-header h1 {
    margin: 0;
    font-size: 1.4rem;
    text-align: center;
    flex-grow: 1; /* Allow title to take space */
}

.header-placeholder {
    width: 60px; /* Match button width approx */
}

.loading-message,
.error-message,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 1rem;
}

.checklist-content h2 {
    text-align: center;
    margin-bottom: 1rem;
    font-weight: normal;
    color: #555;
    font-size: 1.1rem;
}

.checklist-items {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.checklist-items li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.checklist-items li:last-child {
  border-bottom: none;
}

.checklist-items label {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s ease-in-out; /* Add transition for visual feedback */
}

.checklist-items label.item-checked span {
    text-decoration: line-through;
    color: #888;
}

.checklist-items input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 1.2em;
  height: 1.2em;
  accent-color: #007aff; /* Style the check color */
}

.start-log-action {
    text-align: center;
    margin-top: 2rem;
}

.btn-lg {
    padding: 0.8rem 1.5rem;
    font-size: 1.1rem;
}

/* Basic Button Styles (reuse if global styles exist) */
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

.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
   background-color: #545b62;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 0.8rem;
}

.btn-primary {
    background-color: #007aff;
    color: white;
}
.btn-primary:hover:not(:disabled) {
   background-color: #0056b3;
}
.btn-primary:disabled {
    background-color: #a1cfff;
    cursor: not-allowed;
}
</style> 