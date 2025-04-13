<template>
  <div class="view-container stats-view">
    <header class="view-header">
        <h1>Statistics</h1>
         <button @click="fetchStats" :disabled="isLoading" class="btn btn-sm btn-secondary">
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
    </header>

    <div v-if="isLoading" class="loading-message">
      <p>Calculating statistics...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading statistics: {{ error }}</p>
      <button @click="fetchStats" class="btn btn-secondary btn-sm">Retry</button>
    </div>

    <div v-else-if="stats" class="stats-content">
      <!-- Overall Stats -->
      <section class="stats-section overall-stats">
        <h2>Overall</h2>
        <div class="stat-grid">
          <div class="stat-item">
            <span class="label">Total Flights:</span>
            <span class="value">{{ stats.totalFlights }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Total Flight Time:</span>
            <span class="value">{{ formatDuration(stats.totalFlightTimeMinutes) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Average Flight Time:</span>
            <span class="value">{{ formatDuration(stats.averageFlightTimeMinutes, true) }}</span>
          </div>
        </div>
      </section>

      <!-- Stats By Drone -->
      <section class="stats-section drone-stats">
        <h2>By Drone</h2>
        <div v-if="stats.statsByDrone.length > 0">
          <ul class="drone-stats-list">
            <li v-for="droneStat in stats.statsByDrone" :key="droneStat.droneId" class="drone-stat-item">
              <h3>{{ droneStat.droneName }}</h3>
              <div class="stat-grid drone-grid">
                 <div class="stat-item">
                    <span class="label">Flights:</span>
                    <span class="value">{{ droneStat.flightCount }}</span>
                  </div>
                 <div class="stat-item">
                    <span class="label">Total Time:</span>
                    <span class="value">{{ formatDuration(droneStat.totalTimeMinutes) }}</span>
                  </div>
                 <div class="stat-item">
                    <span class="label">Avg Time:</span>
                    <span class="value">{{ formatDuration(droneStat.averageTimeMinutes, true) }}</span>
                  </div>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="empty-state">
          <p>No drone-specific statistics available (or no drones recorded).</p>
        </div>
      </section>
    </div>

    <div v-else class="empty-state">
        <p>No flight logs recorded yet to calculate statistics.</p>
        <router-link to="/log/add" class="btn btn-primary">Record a Flight</router-link>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { calculateAllStats } from '../db/statsService';
import type { CalculatedStats } from '../types/data';
import { RouterLink } from 'vue-router';

const stats = ref<CalculatedStats | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch statistics
const fetchStats = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    stats.value = await calculateAllStats();
  } catch (err) {
    console.error("Error calculating statistics:", err);
    error.value = err instanceof Error ? err.message : "Failed to calculate statistics.";
    stats.value = null; // Clear potentially stale stats on error
  } finally {
    isLoading.value = false;
  }
};

// Format duration in minutes to a more readable format (e.g., Xh Ym)
const formatDuration = (totalMinutes: number, showSecondsForAvg = false): string => {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) {
    return 'N/A';
  }
  if (totalMinutes < 0) return 'Invalid';
  if (totalMinutes === 0) return '0 min';

  const minutes = Math.floor(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (remainingMinutes > 0 || hours === 0) { // Show minutes if non-zero or if hours is zero
      if (showSecondsForAvg && totalMinutes % 1 !== 0) {
          // If it's an average and has decimal part, show with one decimal place
          result += `${totalMinutes.toFixed(1)} min`;
      } else {
          result += `${remainingMinutes} min`;
      }
  }
  
  // Handle cases where totalMinutes is < 1 but > 0 for averages
   if (result.trim() === '' && totalMinutes > 0 && showSecondsForAvg) {
       result = `${totalMinutes.toFixed(1)} min`;
   }

  return result.trim() || '0 min'; // Return trimmed or '0 min' if calculation resulted in empty string somehow
};

// Fetch stats when component is mounted
onMounted(fetchStats);

</script>

<style scoped>
.view-container {
  padding: 1rem;
  padding-bottom: 80px; /* Space for nav */
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

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* Space between sections */
}

.stats-section {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.stats-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  font-size: 1.3em;
}

.stat-grid {
  display: grid;
  gap: 1rem;
}

.overall-stats .stat-grid {
   grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.drone-stats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.drone-stat-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1rem;
}

.drone-stat-item h3 {
    margin-top: 0;
    margin-bottom: 0.8rem;
    font-size: 1.1em;
    color: #333;
}

.drone-grid {
   grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
   gap: 0.8rem;
}


.stat-item {
  /* background-color: #f9f9f9; */
  /* padding: 0.8rem; */
  /* border-radius: 4px; */
  /* text-align: center; */
}

.label {
  display: block;
  font-size: 0.9em;
  color: #666;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1.4em;
  font-weight: bold;
  color: #333;
}

.drone-stat-item .value {
    font-size: 1.2em;
}

/* Basic Button Styles */
/* REMOVED - Now in global style.css */

</style> 