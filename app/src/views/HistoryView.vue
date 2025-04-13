<template>
  <div class="view-container history-view">
    <header class="view-header">
        <h1>Flight History</h1>
        <!-- Filter controls will go here (TASK-HIS-02) -->
         <div class="filter-controls">
            <label for="drone-filter">Filter by Drone:</label>
            <select id="drone-filter" v-model="selectedDroneId" class="form-select form-select-sm">
                <option value="all">All Drones</option>
                <option v-for="drone in drones" :key="drone.id" :value="drone.id">
                    {{ drone.name || 'Unnamed Drone' }}
                </option>
            </select>
         </div>
    </header>

    <div v-if="isLoading || isLoadingDrones" class="loading-message">
      <p>Loading flight history...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading history: {{ error }}</p>
      <button @click="fetchHistoryAndDrones" class="btn btn-secondary btn-sm">Retry</button>
    </div>

    <ul v-else-if="filteredLogs.length > 0" class="log-list">
      <li v-for="log in filteredLogs" :key="log.id" class="log-item">
        <div class="log-info">
          <span class="log-date">{{ formatLogDate(log.flightDate) }}</span>
          <span class="log-drone">{{ log.droneName }}</span>
          <span class="log-duration">{{ log.durationMinutes }} min</span>
        </div>
        <div class="log-actions">
          <!-- Link to Detail View (TASK-HIS-03) -->
          <router-link :to="`/history/${log.id}`" class="btn btn-sm btn-secondary">Details</router-link>
        </div>
      </li>
    </ul>

    <div v-else class="empty-state">
      <p>No flight logs recorded yet.</p>
      <!-- Optional: Link to add log? -->
       <router-link to="/log/add" class="btn btn-primary">Record First Flight</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllFlightLogs } from '../db/flightLogService';
import { getAllDrones } from '../db/droneService';
import type { FlightLog, DroneProfile } from '../types/data';
import { RouterLink } from 'vue-router';

const flightLogs = ref<FlightLog[]>([]);
const drones = ref<DroneProfile[]>([]);
const selectedDroneId = ref<string>('all'); // 'all' or a drone ID
const isLoading = ref(true);
const isLoadingDrones = ref(true);
const error = ref<string | null>(null);

// Fetch flight logs
const fetchHistory = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Fetch logs sorted by date descending (default)
    flightLogs.value = await getAllFlightLogs();
  } catch (err) {
    console.error("Error fetching flight history:", err);
    error.value = err instanceof Error ? err.message : "Failed to load flight history.";
  } finally {
    isLoading.value = false;
  }
};

// Fetch drones for filter dropdown
const fetchDrones = async () => {
  isLoadingDrones.value = true;
  try {
    drones.value = await getAllDrones();
    // Sort drones by name for consistency
    drones.value.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    console.error("Error fetching drones for filter:", err);
    // Handle error - maybe show a message, but keep filter functional
    error.value = (error.value ? error.value + '; ' : '') + "Failed to load drone list for filtering."; 
  } finally {
    isLoadingDrones.value = false;
  }
};

// Computed property to filter logs based on selection
const filteredLogs = computed(() => {
  if (selectedDroneId.value === 'all') {
    return flightLogs.value;
  }
  return flightLogs.value.filter(log => log.droneId === selectedDroneId.value);
});

// Fetch both history and drones
const fetchHistoryAndDrones = async () => {
    isLoading.value = true;
    isLoadingDrones.value = true;
    error.value = null;
    await Promise.all([fetchHistory(), fetchDrones()]);
    // isLoading and isLoadingDrones are set within the individual fetch functions
}

// Format timestamp to a readable date string (e.g., YYYY-MM-DD)
const formatLogDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  try {
      const date = new Date(timestamp);
      // Use options for consistency and clarity
      return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', // 'short' for month abbreviation (e.g., Jan)
          day: 'numeric' 
      }); 
  } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
  }
};

// Fetch data when component is mounted
onMounted(fetchHistoryAndDrones);

</script>

<style scoped>
.view-container {
  padding: 1rem;
  padding-bottom: 80px; /* Ensure space for bottom nav */
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
}

.filter-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-controls label {
    font-size: 0.9em;
    color: #666;
}

/* Style the select dropdown */
.form-select {
    padding: 0.3rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
    font-size: 0.9em;
}

.form-select-sm {
    padding: 0.25rem 0.4rem;
    font-size: 0.85em;
}

.loading-message,
.error-message,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message p {
  color: #dc3545;
  margin-bottom: 10px;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-item {
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

/* Add hover effect for the whole item if linking */
.log-item:hover {
    background-color: var(--light-bg, #f8f9fa);
}

.log-info {
  flex-grow: 1;
  margin-right: 1rem;
  display: flex;
  flex-direction: column; /* Stack info vertically */
  gap: 0.2rem;
}

.log-date {
  font-weight: bold;
  font-size: 0.95em;
}

.log-drone {
  color: #333;
}

.log-duration {
  font-size: 0.9em;
  color: #666;
}

.log-actions .btn {
  margin-left: 0.5rem;
}

.empty-state p {
    margin-bottom: 1rem;
}

/* Basic Button Styles (reuse if global styles exist) */
/* REMOVED - Now in global style.css */

</style> 