<template>
  <div class="view-container flight-log-form-view">
    <header class="view-header">
      <button @click="goBack" class="btn btn-secondary btn-sm">&lt; Cancel</button>
      <h1>{{ formTitle }}</h1>
      <button 
        @click="saveLog" 
        :disabled="!isFormValid || isSaving || isLoadingLogData"
        class="btn btn-primary btn-sm"
      >
        {{ saveButtonText }}
      </button>
    </header>

    <div v-if="isLoadingLogData" class="loading-message">
        Loading log data...
    </div>

    <div v-if="loadingError" class="error-message">
      {{ loadingError }}
    </div>

    <form @submit.prevent="saveLog" class="log-form" v-if="!loadingError">
        <!-- Drone Selection -->
        <div class="form-group">
            <label for="log-drone">Drone *</label>
            <select 
                id="log-drone"
                v-model="formData.droneId" 
                required 
                :disabled="isLoadingDrones"
                @change="updateDroneName" 
            >
                <option :value="null" disabled>-- Select Drone --</option>
                <option v-if="isLoadingDrones" disabled>Loading drones...</option>
                <template v-else>
                    <option v-for="drone in availableDrones" :key="drone.id" :value="drone.id">
                        {{ drone.name }}
                    </option>
                </template>
            </select>
        </div>

        <!-- Date -->
         <div class="form-group">
            <label for="log-date">Date *</label>
            <input 
                type="date" 
                id="log-date" 
                v-model="formData.flightDateStr" 
                required 
            />
        </div>

        <!-- Duration -->
        <div class="form-group">
            <label for="log-duration">Duration (minutes) *</label>
            <input 
                type="number" 
                id="log-duration" 
                v-model.number="formData.durationMinutes" 
                required 
                min="1"
                placeholder="e.g., 15"
            />
        </div>

        <!-- Location -->
        <div class="form-group">
            <label for="log-location">Location Name (Optional)</label>
            <div class="location-input-group">
                <input 
                    type="text" 
                    id="log-location"
                    v-model="formData.locationName" 
                    placeholder="e.g., Central Park"
                />
                <button 
                    type="button" 
                    @click="getCurrentLocation"
                    :disabled="isGettingLocation"
                    class="btn btn-secondary btn-sm location-btn"
                    title="Get Current Location"
                >
                    <span v-if="isGettingLocation">Locating...</span>
                    <span v-else>📍</span>
                </button>
            </div>
            <small v-if="locationError" class="error-text location-error">{{ locationError }}</small>
            <small v-if="formData.locationLat && formData.locationLon" class="form-text location-coords">
                Coords: {{ formData.locationLat.toFixed(4) }}, {{ formData.locationLon.toFixed(4) }}
            </small>
        </div>

         <!-- Weather Condition -->
        <div class="form-group">
            <label for="log-weather">Weather Condition (Optional)</label>
            <select id="log-weather" v-model="formData.weatherCondition">
                <option :value="undefined">-- Select Condition --</option>
                <option v-for="condition in weatherOptions" :key="condition" :value="condition">
                    {{ condition.charAt(0).toUpperCase() + condition.slice(1) }} 
                </option>
            </select>
            <!-- AI Weather comment could go here (TASK-AI-04) -->
        </div>

         <!-- Notes -->
        <div class="form-group">
            <label for="log-notes">Notes (Optional)</label>
            <textarea 
                id="log-notes"
                v-model="formData.notes"
                rows="4"
                placeholder="Flight details, observations, incidents..."
            ></textarea>
        </div>

        <div v-if="saveError" class="error-message save-error">
            Error saving log: {{ saveError }}
        </div>

    </form>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAllDrones, getDrone } from '../db/droneService';
import { addFlightLog, getFlightLog, updateFlightLog } from '../db/flightLogService';
import { checkAndUnlockAchievements } from '../db/achievementService';
import type { DroneProfile, FlightLog, WeatherCondition } from '../types/data';

// Props from router (now includes optional logId for editing)
const props = defineProps<{
    droneId?: string; // For adding from checklist
    checklistId?: string; // For adding from checklist
    logId?: string; // For editing existing log
}>();

const router = useRouter();

// --- Mode --- 
const isEditMode = computed(() => !!props.logId);
const formTitle = computed(() => isEditMode.value ? 'Edit Flight Log' : 'New Flight Log');
const saveButtonText = computed(() => {
    if (isSaving.value) return 'Saving...';
    return isEditMode.value ? 'Update Log' : 'Save Log';
});

// --- State ---
const availableDrones = ref<DroneProfile[]>([]);
const isLoadingDrones = ref(true);
const isSaving = ref(false);
const isLoadingLogData = ref(false); // For loading existing log in edit mode
const loadingError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const isGettingLocation = ref(false);
const locationError = ref<string | null>(null);

// Form data structure (using intermediate types for easier binding)
const formData = ref<{
    droneId: string | null;
    droneName: string; // Store name separately
    checklistId?: string; // Store from props
    flightDateStr: string; // Bind to date input (YYYY-MM-DD)
    durationMinutes: number | null;
    locationName?: string;
    locationLat?: number; // Add latitude
    locationLon?: number; // Add longitude
    weatherCondition?: WeatherCondition;
    notes?: string;
}> ({
    droneId: props.droneId || null,
    droneName: '',
    checklistId: props.checklistId,
    flightDateStr: new Date().toISOString().split('T')[0], // Default to today
    durationMinutes: null,
    locationName: '',
    locationLat: undefined,
    locationLon: undefined,
    weatherCondition: undefined,
    notes: '',
});

// --- Weather Options ---
const weatherOptions: WeatherCondition[] = ['sunny', 'cloudy', 'windy', 'rainy', 'stormy', 'unknown'];

// --- Computed Properties ---
const isFormValid = computed(() => {
  return formData.value.droneId && 
         formData.value.droneName && // Ensure drone name is set
         formData.value.flightDateStr && 
         formData.value.durationMinutes && formData.value.durationMinutes > 0;
});

// --- Methods ---
const goBack = () => {
    // Maybe prompt if form is dirty?
    router.back();
};

// Fetch drone name when droneId prop is set or when selected in dropdown
const updateDroneName = async (event?: Event) => {
    const selectedDroneId = event ? (event.target as HTMLSelectElement).value : formData.value.droneId;
    if (selectedDroneId) {
        const selectedDrone = availableDrones.value.find(d => d.id === selectedDroneId);
        if (selectedDrone) {
            formData.value.droneName = selectedDrone.name;
        } else {
            // If drone came from props but not in list yet (e.g., loading delay), fetch it
            try {
                const drone = await getDrone(selectedDroneId);
                if (drone) formData.value.droneName = drone.name;
                else console.warn(`Drone ${selectedDroneId} not found for name update.`);
            } catch (err) {
                console.error("Error fetching drone for name update:", err);
            }
        }
    }
};

// Get current location using Geolocation API
const getCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
        locationError.value = 'Geolocation is not supported by your browser.';
        return;
    }

    isGettingLocation.value = true;
    locationError.value = null;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            formData.value.locationLat = position.coords.latitude;
            formData.value.locationLon = position.coords.longitude;
            // Optionally try reverse geocoding here to get a name
            if (!formData.value.locationName) {
                // Placeholder if no name entered yet
                formData.value.locationName = `Coords: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
            }
            isGettingLocation.value = false;
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    locationError.value = "Geolocation permission denied.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    locationError.value = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    locationError.value = "Location request timed out.";
                    break;
                default:
                    locationError.value = "An unknown error occurred getting location.";
                    break;
            }
            console.error("Geolocation Error:", error);
            isGettingLocation.value = false;
        },
        {
            enableHighAccuracy: false, // Can set to true for more accuracy (potentially slower/more power)
            timeout: 10000, // 10 seconds
            maximumAge: 0 // Force fresh location
        }
    );
};

// Load existing log data if in edit mode
const loadLogData = async () => {
    if (!isEditMode.value || !props.logId) return;

    isLoadingLogData.value = true;
    loadingError.value = null; 
    try {
        const logToEdit = await getFlightLog(props.logId);
        if (!logToEdit) {
            throw new Error("Flight log not found for editing.");
        }

        // Populate form with existing data
        formData.value = {
            droneId: logToEdit.droneId,
            droneName: logToEdit.droneName,
            checklistId: logToEdit.checklistId,
            flightDateStr: logToEdit.flightDate ? new Date(logToEdit.flightDate).toISOString().split('T')[0] : '', // Format date
            durationMinutes: logToEdit.durationMinutes,
            locationName: logToEdit.location?.name,
            locationLat: logToEdit.location?.latitude,
            locationLon: logToEdit.location?.longitude,
            weatherCondition: logToEdit.weather?.condition,
            notes: logToEdit.notes
        };

    } catch (err) {
        console.error("Error loading flight log for editing:", err);
        loadingError.value = err instanceof Error ? err.message : "Failed to load log data.";
        // Potentially disable form or show persistent error
    } finally {
        isLoadingLogData.value = false;
    }
};

// Fetch Drones for dropdown
const fetchDrones = async () => {
    isLoadingDrones.value = true;
    loadingError.value = null;
    try {
        availableDrones.value = await getAllDrones();
    } finally {
        isLoadingDrones.value = false;
        // Ensure drone name is set if droneId was pre-filled (add or edit)
        if (formData.value.droneId && !formData.value.droneName) {
            await updateDroneName();
        }
    }
};

// Save Log (Handles both Add and Update)
const saveLog = async () => {
  if (!isFormValid.value || isSaving.value) return;

  isSaving.value = true;
  saveError.value = null;

  // Convert date string back to timestamp
  const flightDateTimestamp = new Date(formData.value.flightDateStr).getTime();

  const logData: Omit<FlightLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
    droneId: formData.value.droneId!,
    droneName: formData.value.droneName,
    checklistId: formData.value.checklistId,
    flightDate: flightDateTimestamp,
    durationMinutes: formData.value.durationMinutes!,
    location: {
        name: formData.value.locationName,
        latitude: formData.value.locationLat,
        longitude: formData.value.locationLon,
    },
    weather: formData.value.weatherCondition ? { 
        condition: formData.value.weatherCondition 
        // Add temperature/aiComment later if needed
    } : undefined,
    notes: formData.value.notes,
  };

  let success = false;
  try {
    if (isEditMode.value && props.logId) {
        // Update existing log
        const logToUpdate: FlightLog = {
            ...logData,
            id: props.logId,
            createdAt: 0, // These will be ignored by update but needed for type
            updatedAt: 0, // This will be set by updateFlightLog
            // Need to fetch original log to preserve fields not in the form (like aiSummary)
            // For now, we assume update overwrites based on form fields + sets new updatedAt
        };
        await updateFlightLog(logToUpdate); // Assuming updateFlightLog handles setting updatedAt
        success = true;
        router.push({ name: 'LogDetail', params: { logId: props.logId } }); // Go back to detail view
    } else {
        // Add new log
        await addFlightLog(logData);
        success = true;
        router.push({ name: 'History' }); // Navigate to history list after adding
    }

  } catch (err) {
    console.error("Error saving flight log:", err);
    saveError.value = err instanceof Error ? err.message : "Failed to save flight log.";
  } finally {
    isSaving.value = false;
    if (success) {
        // Check for achievements after successful save/update
        // Run this async, don't wait for it or block UI
        checkAndUnlockAchievements().then(newAchievements => {
            if (newAchievements.length > 0) {
                // Optional: trigger notification (TASK-ACH-06)
                console.log("Triggering notifications for:", newAchievements);
                // Simple alert as placeholder notification
                const achievementText = newAchievements.length === 1 
                    ? `Achievement Unlocked: ${newAchievements[0]}!` 
                    : `Unlocked ${newAchievements.length} Achievements! Check the Achievements tab.`;
                alert(achievementText); 
            }
        }).catch(err => {
            console.error("Background achievement check failed:", err);
        });
    }
  }
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  loadingError.value = null; // Reset errors on mount
  saveError.value = null;
  // Start fetching drones immediately
  const droneFetchPromise = fetchDrones(); 

  // If in edit mode, load existing log data
  if (isEditMode.value) {
    await loadLogData(); 
  }
  
  // Wait for drone fetch to complete before ensuring name is set
  await droneFetchPromise;
  // If droneId was set by props (add mode) or loaded (edit mode), ensure name is populated
  if (formData.value.droneId && !formData.value.droneName) {
      await updateDroneName();
  }

  // If adding and droneId came from props, ensure it's selected and name updated
  if (!isEditMode.value && props.droneId) {
    formData.value.droneId = props.droneId;
    // updateDroneName will be called by fetchDrones completion or watcher
  }
});

// Watch for external changes to droneId (though less likely with current setup)
watch(() => props.droneId, (newDroneId) => {
    if (!isEditMode.value && newDroneId && newDroneId !== formData.value.droneId) {
        formData.value.droneId = newDroneId;
        updateDroneName();
    }
});

// Watch for drone selection changes to update name
watch(() => formData.value.droneId, (newId, oldId) => {
    if (newId !== oldId) {
        updateDroneName();
    }
});

</script>

<style scoped>
.view-container {
  padding: 1rem;
  padding-bottom: 80px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.view-header h1 {
    margin: 0;
    font-size: 1.4rem;
    text-align: center;
    flex-grow: 1;
}

.log-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 600px; 
  margin: 0 auto; 
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; 
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #007aff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group select[disabled] {
    background-color: #e9ecef;
    cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem; 
}

.save-error {
    margin-top: 1rem;
}

/* Styles remain largely the same, minor adjustments might be needed */
/* REMOVED Local Button Styles - Now in global style.css */
</style> 