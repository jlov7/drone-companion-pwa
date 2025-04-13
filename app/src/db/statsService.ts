import * as droneService from './droneService';
import * as flightLogService from './flightLogService';
import type { CalculatedStats, StatsByDrone } from "../types/data";

/**
 * Calculates various flight statistics based on all flight logs and drone profiles.
 *
 * @returns {Promise<CalculatedStats>} A promise that resolves with the calculated statistics.
 */
export async function calculateAllStats(): Promise<CalculatedStats> {
    try {
        // Get all logs and drones
        let allLogs;
        try {
            allLogs = await flightLogService.getAllFlightLogs();
        } catch (error) {
            console.error('Error loading flight logs:', error);
            throw error;
        }
        
        let allDrones;
        try {
            allDrones = await droneService.getAllDrones();
        } catch (error) {
            console.error('Error loading drones:', error);
            throw error;
        }
        
        // Calculate total flights and time
        const totalFlights = allLogs.length;
        const totalFlightTimeMinutes = allLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
        
        // Calculate average time (avoid division by zero)
        const averageFlightTimeMinutes = totalFlights > 0 
            ? Math.round((totalFlightTimeMinutes / totalFlights) * 10) / 10 
            : 0;
        
        // Create a map to group logs by drone
        const logsByDroneId = new Map<string, { count: number, totalTime: number }>();
        
        // Initialize map with all known drones (to include those with zero flights)
        for (const drone of allDrones) {
            logsByDroneId.set(drone.id, { count: 0, totalTime: 0 });
        }
        
        // Populate the map with counts and totals from logs
        for (const log of allLogs) {
            if (!logsByDroneId.has(log.droneId)) {
                // This is for drones that exist in logs but not in the drone list
                logsByDroneId.set(log.droneId, { count: 0, totalTime: 0 });
            }
            
            const droneStats = logsByDroneId.get(log.droneId)!;
            droneStats.count++;
            droneStats.totalTime += log.durationMinutes;
        }
        
        // Calculate per-drone statistics
        const statsByDrone: StatsByDrone[] = [];
        
        // Find drone names and calculate averages
        for (const [droneId, stats] of logsByDroneId.entries()) {
            // Find the drone to get the name
            let droneName = "Unknown Drone";
            
            // Try to get current drone name
            const drone = allDrones.find(d => d.id === droneId);
            if (drone) {
                droneName = drone.name;
            } else if (allLogs.some(log => log.droneId === droneId)) {
                // If drone no longer exists, use the name from the most recent log and mark as deleted
                const latestLog = [...allLogs]
                    .filter(log => log.droneId === droneId)
                    .sort((a, b) => b.flightDate - a.flightDate)[0];
                    
                droneName = "Deleted Drone: " + latestLog.droneName;
            }
            
            // Calculate average
            const averageTimeMinutes = stats.count > 0 
                ? Math.round((stats.totalTime / stats.count) * 10) / 10
                : 0;
                
            statsByDrone.push({
                droneId,
                droneName,
                flightCount: stats.count,
                totalTimeMinutes: stats.totalTime,
                averageTimeMinutes,
            });
        }
        
        // Sort by flight count descending, then by total flight time descending
        statsByDrone.sort((a, b) => {
            // First by flight count
            if (b.flightCount !== a.flightCount) {
                return b.flightCount - a.flightCount;
            }
            // If flight count is the same, sort by total time
            return b.totalTimeMinutes - a.totalTimeMinutes;
        });
        
        return {
            totalFlights,
            totalFlightTimeMinutes,
            averageFlightTimeMinutes,
            statsByDrone,
        };
        
    } catch (error) {
        console.error('Error calculating stats:', error);
        throw error;
    }
}

// Potential future functions:
// - getStatsForDrone(droneId: string): Promise<StatsByDrone>
// - getLongestFlight(): Promise<FlightLog | null> 