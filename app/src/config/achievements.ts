import type { CalculatedStats, FlightLog } from "../types/data";

export interface AchievementDefinition {
    id: string; // Unique identifier (e.g., 'first_flight')
    name: string;
    description: string;
    icon?: string; // Optional icon class or path
    check: (stats: CalculatedStats, logs: FlightLog[]) => boolean; // Function to check if criteria met
    isDroneSpecific?: boolean; // Indicates if this can be awarded per drone
}

// --- Achievement Definitions ---

export const achievements: AchievementDefinition[] = [
    // Flight Count Achievements
    {
        id: 'first_flight',
        name: 'First Flight',
        description: 'Completed your first logged flight.',
        icon: '✈️', // Example emoji icon
        check: (stats) => stats.totalFlights >= 1,
    },
    {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Logged 5 flights.',
        icon: '🚀',
        check: (stats) => stats.totalFlights >= 5,
    },
    {
        id: 'frequent_flyer',
        name: 'Frequent Flyer',
        description: 'Logged 25 flights.',
        icon: '🌟',
        check: (stats) => stats.totalFlights >= 25,
    },

    // Flight Time Achievements
    {
        id: 'air_time_apprentice',
        name: 'Air Time Apprentice',
        description: 'Reached 1 hour of total flight time.',
        icon: '⏱️',
        check: (stats) => stats.totalFlightTimeMinutes >= 60,
    },
    {
        id: 'air_time_ace',
        name: 'Air Time Ace',
        description: 'Reached 5 hours of total flight time.',
        icon: '🏆',
        check: (stats) => stats.totalFlightTimeMinutes >= 300,
    },

    // Per-Drone Achievement (Example)
    {
        id: 'drone_specialist',
        name: 'Drone Specialist',
        description: 'Logged 10 flights with a single drone.',
        icon: '🛠️',
        isDroneSpecific: true, // This will be checked against each drone's stats
        // The main check function verifies if *any* drone meets the criteria
        check: (stats) => stats.statsByDrone.some(droneStat => droneStat.flightCount >= 10),
    },

    // Time-Based Achievements
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Logged a flight starting before 7 AM.',
        icon: '☀️',
        check: (_stats, logs) => logs.some(log => new Date(log.flightDate).getHours() < 7),
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Logged a flight starting after 8 PM (20:00).',
        icon: '🦉',
        check: (_stats, logs) => logs.some(log => new Date(log.flightDate).getHours() >= 20),
    },

    // Variety Achievements (More complex checks)
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Logged flights on both a Saturday and a Sunday.',
        icon: '📅',
        check: (_stats, logs) => {
            const days = new Set(logs.map(log => new Date(log.flightDate).getDay()));
            return days.has(6) && days.has(0); // 6 = Saturday, 0 = Sunday
        },
    },
    {
        id: 'location_scout',
        name: 'Location Scout',
        description: 'Logged flights in at least 3 different named locations.',
        icon: '🗺️',
        check: (_stats, logs) => {
            const locations = new Set(logs.map(log => log.location?.name).filter(name => !!name));
            return locations.size >= 3;
        },
    },
];

/**
 * Generates the specific achievement ID for a drone-specific achievement.
 * @param baseAchievementId The base ID (e.g., 'drone_specialist')
 * @param droneId The drone's ID
 * @returns The combined ID (e.g., 'drone_specialist_d123')
 */
export const getDroneSpecificAchievementId = (baseAchievementId: string, droneId: string): string => {
    return `${baseAchievementId}_${droneId}`;
}; 