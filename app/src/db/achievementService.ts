import type { UnlockedAchievement, CalculatedStats } from '../types/data';
import { openDB, STORE_ACHIEVEMENTS } from './indexedDB';
import * as statsService from './statsService';
import * as flightLogService from './flightLogService';
import { achievements as achievementDefinitions, getDroneSpecificAchievementId } from '../config/achievements';

// Get all unlocked achievements
export async function getUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_ACHIEVEMENTS, 'readonly');
    const store = transaction.objectStore(STORE_ACHIEVEMENTS);
    const items = await store.getAll();
    return items as unknown as UnlockedAchievement[];
  } catch (error) {
    console.error('Error getting unlocked achievements:', error);
    throw error;
  }
}

// Check if a specific achievement is unlocked
export async function isAchievementUnlocked(achievementId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_ACHIEVEMENTS, 'readonly');
    const store = transaction.objectStore(STORE_ACHIEVEMENTS);
    const achievement = await store.get(achievementId);
    return !!achievement;
  } catch (error) {
    console.error(`Error checking if achievement ${achievementId} is unlocked:`, error);
    throw error;
  }
}

// Add unlocked achievement to database
export async function addUnlockedAchievement(achievementId: string): Promise<string> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_ACHIEVEMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_ACHIEVEMENTS);
    
    // Check if already unlocked to avoid duplicates
    const existing = await store.get(achievementId);
    if (existing) {
      return achievementId; // Already unlocked
    }
    
    const achievement: UnlockedAchievement = {
      id: achievementId,
      unlockedAt: Date.now()
    };
    
    await store.add(achievement);
    return achievementId;
  } catch (error) {
    console.error(`Error unlocking achievement ${achievementId}:`, error);
    throw error;
  }
}

// Process drone-specific achievements
async function processDroneSpecificAchievements(
  achievement: { id: string, isDroneSpecific?: boolean }, 
  unlockedIds: string[], 
  stats: CalculatedStats,
  newlyUnlocked: string[]
): Promise<string[]> {
  // Skip if not a drone-specific achievement
  if (!achievement.isDroneSpecific || !stats.statsByDrone) {
    return newlyUnlocked;
  }
  
  // Process each drone
  for (const droneStats of stats.statsByDrone) {
    // Only process if drone has the minimum flights required
    if (droneStats.flightCount < 10) {
      continue;
    }
    
    // Create the specific ID for this drone
    const specificId = getDroneSpecificAchievementId(achievement.id, droneStats.droneId);
    
    // Skip if already unlocked
    if (unlockedIds.includes(specificId)) {
      continue;
    }
    
    // Check based on achievement type
    if (achievement.id === 'drone_specialist') {
      console.log(`Unlocking ${specificId} for drone with ${droneStats.flightCount} flights`);
      await addUnlockedAchievement(specificId);
      newlyUnlocked.push(specificId);
    }
  }
  
  return newlyUnlocked;
}

// Check and unlock achievements based on stats and logs
export async function checkAndUnlockAchievements(): Promise<string[]> {
  try {
    const stats = await statsService.calculateAllStats();
    const logs = await flightLogService.getAllFlightLogs();
    const unlocked = await getUnlockedAchievements();
    const unlockedIds = unlocked.map(a => a.id);
    
    let newlyUnlocked: string[] = [];
    
    // Process each achievement
    for (const achievement of achievementDefinitions) {
      // Skip already unlocked regular achievements
      if (unlockedIds.includes(achievement.id)) {
        continue;
      }
      
      // For regular achievements
      if (achievement.check(stats, logs)) {
        await addUnlockedAchievement(achievement.id);
        newlyUnlocked.push(achievement.id);
      }
      
      // For drone-specific achievements (using the separate helper function)
      if (achievement.isDroneSpecific) {
        newlyUnlocked = await processDroneSpecificAchievements(
          achievement, 
          unlockedIds, 
          stats, 
          newlyUnlocked
        );
      }
    }
    
    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return []; // Return empty array on error
  }
}

// Potential future functions:
// - clearAchievements() // For testing or reset 