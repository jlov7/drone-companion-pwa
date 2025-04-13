<template>
  <div class="view-container log-detail-view">
    <header class="view-header">
      <router-link to="/history" class="btn btn-sm btn-back">&lt; Back to History</router-link>
      <h1>Flight Log Details</h1>
      <div><!-- Placeholder for right alignment --></div>
    </header>

    <div v-if="isLoading" class="loading-message">
      <p>Loading log details...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading log: {{ error }}</p>
      <button @click="fetchLogDetails" class="btn btn-secondary btn-sm">Retry</button>
    </div>

    <div v-else-if="log" class="log-details-content">
      <h2>Flight Summary</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Drone:</span>
          <span class="value">{{ log.droneName || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Date:</span>
          <span class="value">{{ formatDisplayDate(log.flightDate) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Duration:</span>
          <span class="value">{{ log.durationMinutes }} minutes</span>
        </div>
        <div class="detail-item">
          <span class="label">Location:</span>
          <span class="value">{{ log.location?.name || 'N/A' }}</span>
        </div>
         <div v-if="log.location?.latitude && log.location?.longitude" class="detail-item full-width">
          <span class="label">Coordinates:</span>
          <span class="value">{{ log.location.latitude.toFixed(5) }}, {{ log.location.longitude.toFixed(5) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Weather:</span>
          <span class="value">{{ log.weather?.condition || 'N/A' }}</span>
        </div>
        <div v-if="typeof log.weather?.temperature === 'number'" class="detail-item">
          <span class="label">Temperature:</span>
          <span class="value">{{ log.weather.temperature }} &deg;C</span>
        </div>
        <div v-if="log.weather?.aiComment" class="detail-item full-width">
          <span class="label">Weather Comment (AI):</span>
          <span class="value">{{ log.weather.aiComment }}</span>
        </div>
        <div class="detail-item full-width">
          <span class="label">Notes:</span>
          <p class="notes-value">{{ log.notes || 'No notes recorded.' }}</p>
        </div>
      </div>

      <!-- Placeholder for Edit/Delete buttons (TASK-HIS-04) -->
      <div class="log-actions">
        <button @click="editLog" class="btn btn-secondary">Edit</button>
        <button @click="confirmDeleteLog" class="btn btn-danger">Delete</button>
      </div>

      <!-- Placeholder for AI Summary (TASK-AI-03) -->
      <!-- 
      <div class="ai-section">
        <h3>AI Flight Summary</h3>
        <button class="btn btn-sm btn-info">Generate Summary (Coming Soon)</button>
      </div> 
      -->
    </div>

    <div v-else class="not-found-message">
      <p>Flight log not found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { getFlightLog, deleteFlightLog } from '../db/flightLogService';
import type { FlightLog } from '../types/data';

interface Props {
  logId: string; // Received from router props
}

const props = defineProps<Props>();
const router = useRouter();

const log = ref<FlightLog | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch log details
const fetchLogDetails = async () => {
  isLoading.value = true;
  error.value = null;
  log.value = null; // Reset log before fetching

  if (!props.logId) {
    error.value = "No Log ID provided.";
    isLoading.value = false;
    return;
  }

  try {
    const fetchedLog = await getFlightLog(props.logId);
    if (fetchedLog) {
      log.value = fetchedLog;
    } else {
      error.value = "Flight log not found.";
    }
  } catch (err) {
    console.error("Error fetching flight log details:", err);
    error.value = err instanceof Error ? err.message : "Failed to load flight log details.";
  } finally {
    isLoading.value = false;
  }
};

// Format timestamp for display (e.g., January 1, 2024)
const formatDisplayDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

// Edit Log: Navigate to Log Form View for editing
const editLog = () => {
  if (log.value) {
    // Navigate to the edit route with the log ID
    router.push({ name: 'EditFlightLog', params: { logId: log.value.id } });
  }
};

// Delete Log: Confirm and then delete
const confirmDeleteLog = async () => {
  if (!log.value) return;

  if (window.confirm(`Are you sure you want to delete the flight log from ${formatDisplayDate(log.value.flightDate)}?`)) {
    isLoading.value = true; // Show loading indicator during delete
    error.value = null;
    try {
      await deleteFlightLog(log.value.id);
      // On successful deletion, navigate back to history list
      router.push({ name: 'History' });
      // Optional: Show a success message (e.g., using a toast library)
    } catch (err) {
      console.error("Error deleting flight log:", err);
      error.value = err instanceof Error ? err.message : "Failed to delete flight log.";
      isLoading.value = false; // Hide loading indicator on error
      // Show error message to user (e.g., below the buttons)
    }
  }
};

// Fetch data when component is mounted
onMounted(fetchLogDetails);

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
  text-align: center; /* Center title */
  flex-grow: 1; /* Allow title to take space */
}

.loading-message,
.error-message,
.not-found-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message p {
  color: #dc3545;
  margin-bottom: 10px;
}

.log-details-content {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.log-details-content h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive grid */
    gap: 1rem; /* Spacing between items */
    margin-bottom: 1.5rem;
}

.detail-item {
    /* Styles for individual detail items */
    padding-bottom: 0.5rem;
    /* border-bottom: 1px dashed #eee; Optional separator */
}

.detail-item.full-width {
    grid-column: 1 / -1; /* Make item span full width */
}

.label {
  display: block;
  font-weight: bold;
  color: #555;
  margin-bottom: 0.25rem;
  font-size: 0.9em;
}

.value {
  /* Style for the value */
  font-size: 1em;
}

.notes-value {
    white-space: pre-wrap; /* Preserve line breaks in notes */
    background-color: #f9f9f9;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #eee;
    margin: 0; /* Remove default paragraph margin */
}

.log-actions {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  gap: 0.5rem;
}

.btn-back {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ccc;
}
.btn-back:hover {
  background-color: #e2e6ea;
}

/* Basic Button Styles (reuse if global styles exist) */
/* REMOVED - Now in global style.css */

</style> 