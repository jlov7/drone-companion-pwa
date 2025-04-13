export interface DroneProfile {
  id: string; // Unique ID (e.g., generated UUID or timestamp-based)
  name: string;
  model?: string;
  notes?: string;
  imageUrl?: string; // DEPRECATED - Use imageDataUrl for local storage
  imageDataUrl?: string; // Optional Data URL for locally stored image
  defaultChecklistId?: string; // ID of the default checklist for this drone
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export interface ChecklistItem {
  id: string; // Unique within the checklist
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string; // Unique ID
  name: string;
  droneId?: string | null; // Link to a specific drone, or null if template
  isTemplate: boolean;
  items: ChecklistItem[];
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'windy' | 'rainy' | 'stormy' | 'unknown';

export interface FlightLog {
  id: string; // Unique ID
  droneId: string; // ID of the drone used
  droneName: string; // Store name at time of logging for historical accuracy
  checklistId?: string; // ID of the checklist used (optional)
  flightDate: number; // Timestamp of flight start
  durationMinutes: number; // Flight duration
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string; // User-entered or reverse-geocoded name
    aiTip?: string; // Optional AI-generated tip
  };
  weather?: {
    condition: WeatherCondition;
    temperature?: number; // Optional temperature (Celsius?)
    aiComment?: string; // Optional AI-generated comment
  };
  notes?: string;
  aiSummary?: string; // Optional AI-generated summary
  createdAt: number; // Timestamp of log creation
  updatedAt: number; // Timestamp of log update
  // Potentially add fields for pre/post flight battery levels etc.
}

export interface UnlockedAchievement {
  id: string; // Achievement identifier (e.g., 'first_flight')
  unlockedAt: number; // Timestamp when unlocked
}

// Could also define the Achievement criteria structure here if needed
// export interface AchievementDefinition {
//   id: string;
//   name: string;
//   description: string;
//   criteria: (logs: FlightLog[], stats: CalculatedStats) => boolean;
// }

export interface StatsByDrone {
    droneId: string;
    droneName: string;
    flightCount: number;
    totalTimeMinutes: number;
    averageTimeMinutes: number;
}

export interface CalculatedStats {
    totalFlights: number;
    totalFlightTimeMinutes: number;
    averageFlightTimeMinutes: number;
    statsByDrone: StatsByDrone[];
    // Potentially add more: longestFlight, mostFrequentDroneId, etc.
} 