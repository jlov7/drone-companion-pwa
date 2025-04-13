<template>
  <div class="view-container achievements-view">
    <header class="view-header">
        <h1>Achievements</h1>
         <button @click="loadAchievements" :disabled="isLoading" class="btn btn-sm btn-secondary">
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
    </header>

    <div v-if="isLoading" class="loading-message">
      <p>Loading achievements...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>Error loading achievements: {{ error }}</p>
      <button @click="loadAchievements" class="btn btn-secondary btn-sm">Retry</button>
    </div>

    <div v-else-if="displayAchievements.length > 0" class="achievements-list">
        <div v-for="ach in displayAchievements" :key="ach.displayId" 
             class="achievement-item" 
             :class="{ unlocked: ach.unlockedAt }">
            <div class="icon">{{ ach.icon || '🏅' }}</div>
            <div class="details">
                <h3>{{ ach.name }} <span v-if="ach.droneName">({{ ach.droneName }})</span></h3>
                <p class="description">{{ ach.description }}</p>
                <p v-if="ach.unlockedAt" class="unlocked-date">
                    Unlocked: {{ formatUnlockDate(ach.unlockedAt) }}
                </p>
            </div>
        </div>
    </div>

     <div v-else class="empty-state">
        <p>No achievements defined yet.</p>
        <!-- This message likely won't show if definitions exist -->
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getUnlockedAchievements } from '../db/achievementService';
import { getAllDrones } from '../db/droneService'; // Needed for drone-specific names
import { achievements as achievementDefinitions } from '../config/achievements';
import type { AchievementDefinition } from '../config/achievements';
import type { UnlockedAchievement, DroneProfile } from '../types/data';

// Interface for combined display data
interface DisplayAchievement extends AchievementDefinition {
    unlockedAt: number | null;
    droneName?: string; // For drone-specific achievements
    displayId: string; // Unique key for v-for (could be base id or specific id)
}

const unlockedAchievements = ref<UnlockedAchievement[]>([]);
const drones = ref<DroneProfile[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch unlocked achievements and drone list
const loadAchievements = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const [unlocked, droneList] = await Promise.all([
        getUnlockedAchievements(),
        getAllDrones()
    ]);
    unlockedAchievements.value = unlocked;
    drones.value = droneList;
  } catch (err) {
    console.error("Error loading achievement data:", err);
    error.value = err instanceof Error ? err.message : "Failed to load achievements.";
  } finally {
    isLoading.value = false;
  }
};

// Computed property to merge definitions with unlocked status
const displayAchievements = computed((): DisplayAchievement[] => {
    const unlockedMap = new Map(unlockedAchievements.value.map(ach => [ach.id, ach.unlockedAt]));
    const droneMap = new Map(drones.value.map(d => [d.id, d.name]));
    const result: DisplayAchievement[] = [];

    achievementDefinitions.forEach(def => {
        if (def.isDroneSpecific) {
            // For drone-specific achievements, check each unlocked instance
            unlockedAchievements.value.forEach(unlocked => {
                // Check if the unlocked ID starts with the base definition ID + '_'
                if (unlocked.id.startsWith(def.id + '_')) {
                    const droneId = unlocked.id.substring((def.id + '_').length);
                    result.push({
                        ...def,
                        unlockedAt: unlocked.unlockedAt,
                        droneName: droneMap.get(droneId) || 'Unknown Drone',
                        displayId: unlocked.id // Use specific ID as key
                    });
                }
            });
            // Optionally, add locked versions for drones that *could* unlock it? 
            // For now, only showing unlocked drone-specific ones.

        } else {
            // Non-drone-specific achievement
            const unlockedAt = unlockedMap.get(def.id) || null;
             result.push({
                ...def,
                unlockedAt,
                displayId: def.id
            });
        }
    });
    
    // Sort: Unlocked first, then alphabetically by name
    result.sort((a, b) => {
        const unlockedA = a.unlockedAt ? 1 : 0;
        const unlockedB = b.unlockedAt ? 1 : 0;
        if (unlockedB !== unlockedA) {
            return unlockedB - unlockedA; // Unlocked first
        }
        return a.name.localeCompare(b.name);
    });

    return result;
});

// Format timestamp for display (e.g., January 1, 2024)
const formatUnlockDate = (timestamp: number): string => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Fetch data when component is mounted
onMounted(loadAchievements);

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

.achievements-list {
  display: grid;
  gap: 1rem;
  /* grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); Maybe later */
}

.achievement-item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: 0.6; /* Default opacity for locked */
  transition: opacity 0.3s ease, border-color 0.3s ease;
  border-left: 5px solid #ccc; /* Default border */
}

.achievement-item.unlocked {
  opacity: 1;
  border-left-color: #28a745; /* Green border for unlocked */
}

.icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 50px; /* Fixed width for icon */
  text-align: center;
}

.details {
  flex-grow: 1;
}

.details h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.1em;
}

.details h3 span {
    font-weight: normal;
    font-size: 0.9em;
    color: #555;
}

.description {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 0.5rem;
}

.unlocked-date {
  font-size: 0.8em;
  color: #28a745; /* Green color for unlocked date */
  font-weight: bold;
  margin: 0;
}

/* Basic Button Styles */
/* REMOVED - Now in global style.css */

</style> 