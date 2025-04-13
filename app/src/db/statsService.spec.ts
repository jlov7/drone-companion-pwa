import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
    calculateAllStats
} from './statsService';
import * as flightLogService from './flightLogService';
import * as droneService from './droneService';
import type { FlightLog, DroneProfile } from '../types/data';

// Mock dependencies
vi.mock('./indexedDB', () => ({
    openDB: vi.fn(),
    STORE_STATS: 'stats'
}));

vi.mock('./flightLogService', () => ({
    getAllFlightLogs: vi.fn()
}));

// Mock the DB service modules
vi.mock('./droneService');

// Mock Data
const mockDrones: DroneProfile[] = [
    {
        id: 'd1', name: 'Mavic Mini', createdAt: Date.now(), updatedAt: Date.now(),
        model: 'DJI', defaultChecklistId: 'chk1'
    },
    {
        id: 'd2', name: 'Air 2S', createdAt: Date.now(), updatedAt: Date.now(),
        model: 'DJI'
    },
    {
        id: 'd3', name: 'Autel Evo', createdAt: Date.now(), updatedAt: Date.now(),
        model: 'Autel'
    }
];

const mockLogs: FlightLog[] = [
    {
        id: 'l1', droneId: 'd1', droneName: 'Mavic Mini', flightDate: Date.now() - 86400000 * 2, durationMinutes: 15,
        createdAt: Date.now(), updatedAt: Date.now()
    },
    {
        id: 'l2', droneId: 'd2', droneName: 'Air 2S', flightDate: Date.now() - 86400000, durationMinutes: 25,
        createdAt: Date.now(), updatedAt: Date.now()
    },
    {
        id: 'l3', droneId: 'd1', droneName: 'Mavic Mini', flightDate: Date.now(), durationMinutes: 10,
        createdAt: Date.now(), updatedAt: Date.now()
    },
    {
        id: 'l4', droneId: 'd_deleted', droneName: 'Old Phantom', flightDate: Date.now() - 86400000 * 5, durationMinutes: 20,
        createdAt: Date.now(), updatedAt: Date.now() // Log for a drone not in mockDrones
    }
];

describe('Stats Service', () => {
    beforeEach(() => {
        // Reset mocks
        vi.resetAllMocks();

        // Mock the droneService.getAllDrones function
        (droneService.getAllDrones as MockedFunction<typeof droneService.getAllDrones>).mockResolvedValue(mockDrones);
        // Mock the flightLogService.getAllFlightLogs function
        (flightLogService.getAllFlightLogs as MockedFunction<typeof flightLogService.getAllFlightLogs>).mockResolvedValue(mockLogs);
    });

    describe('calculateAllStats', () => {
        it('should calculate stats correctly from flight logs and drones', async () => {
            // Mocks are now set in beforeEach

            const calculatedStats = await calculateAllStats();

            // Expected calculated values based on mockLogs and mockDrones
            expect(calculatedStats.totalFlights).toBe(4);
            expect(calculatedStats.totalFlightTimeMinutes).toBe(15 + 25 + 10 + 20); // 70
            expect(calculatedStats.averageFlightTimeMinutes).toBeCloseTo(70 / 4); // 17.5

            // Check structure and stats for each drone
            expect(calculatedStats.statsByDrone).toHaveLength(4); // d1, d2, d3 (0 flights), d_deleted

            // Drone d1 (Mavic Mini)
            const statsD1 = calculatedStats.statsByDrone.find(s => s.droneId === 'd1');
            expect(statsD1).toBeDefined();
            expect(statsD1?.droneName).toBe('Mavic Mini');
            expect(statsD1?.flightCount).toBe(2);
            expect(statsD1?.totalTimeMinutes).toBe(15 + 10); // 25
            expect(statsD1?.averageTimeMinutes).toBeCloseTo(25 / 2); // 12.5

            // Drone d2 (Air 2S)
            const statsD2 = calculatedStats.statsByDrone.find(s => s.droneId === 'd2');
            expect(statsD2).toBeDefined();
            expect(statsD2?.droneName).toBe('Air 2S');
            expect(statsD2?.flightCount).toBe(1);
            expect(statsD2?.totalTimeMinutes).toBe(25);
            expect(statsD2?.averageTimeMinutes).toBe(25);

            // Drone d3 (Autel Evo) - Should be included even with 0 flights
            const statsD3 = calculatedStats.statsByDrone.find(s => s.droneId === 'd3');
            expect(statsD3).toBeDefined();
            expect(statsD3?.droneName).toBe('Autel Evo');
            expect(statsD3?.flightCount).toBe(0);
            expect(statsD3?.totalTimeMinutes).toBe(0);
            expect(statsD3?.averageTimeMinutes).toBe(0);

            // Deleted Drone (d_deleted)
            const statsDeleted = calculatedStats.statsByDrone.find(s => s.droneId === 'd_deleted');
            expect(statsDeleted).toBeDefined();
            // Name should indicate it was deleted, using the last known name from the log
            expect(statsDeleted?.droneName).toBe('Deleted Drone: Old Phantom');
            expect(statsDeleted?.flightCount).toBe(1);
            expect(statsDeleted?.totalTimeMinutes).toBe(20);
            expect(statsDeleted?.averageTimeMinutes).toBe(20);

             // Verify sorting (by flight count desc, then total time desc)
             // Expected order: d1 (2 flights), d2 (1 flight, 25min), d_deleted (1 flight, 20min), d3 (0 flights)
             expect(calculatedStats.statsByDrone[0].droneId).toBe('d1');
             expect(calculatedStats.statsByDrone[1].droneId).toBe('d2');
             expect(calculatedStats.statsByDrone[2].droneId).toBe('d_deleted');
             expect(calculatedStats.statsByDrone[3].droneId).toBe('d3');

        });

        it('should handle empty flight logs', async () => {
            // Override mock for this test case
            (flightLogService.getAllFlightLogs as MockedFunction<typeof flightLogService.getAllFlightLogs>)
                .mockResolvedValue([]);
             // Ensure drones are still mocked to test inclusion of drones with 0 flights
            (droneService.getAllDrones as MockedFunction<typeof droneService.getAllDrones>).mockResolvedValue(mockDrones);


            const calculatedStats = await calculateAllStats();

            expect(calculatedStats.totalFlights).toBe(0);
            expect(calculatedStats.totalFlightTimeMinutes).toBe(0);
            expect(calculatedStats.averageFlightTimeMinutes).toBe(0);
            expect(calculatedStats.statsByDrone).toHaveLength(mockDrones.length); // Should list all drones with 0 stats

            // Check stats for one drone (e.g., d1)
            const statsD1 = calculatedStats.statsByDrone.find(s => s.droneId === 'd1');
            expect(statsD1).toBeDefined();
            expect(statsD1?.droneName).toBe('Mavic Mini');
            expect(statsD1?.flightCount).toBe(0);
            expect(statsD1?.totalTimeMinutes).toBe(0);
            expect(statsD1?.averageTimeMinutes).toBe(0);

             // Verify sorting still applies (all 0, so original order might be preserved or alphabetical)
             // Let's just ensure the length is correct
             expect(calculatedStats.statsByDrone.length).toBe(mockDrones.length);
        });

         it('should handle empty drone list', async () => {
            // Mock drones as empty
            (droneService.getAllDrones as MockedFunction<typeof droneService.getAllDrones>).mockResolvedValue([]);
            // Keep logs mocked
            (flightLogService.getAllFlightLogs as MockedFunction<typeof flightLogService.getAllFlightLogs>).mockResolvedValue(mockLogs);

            const calculatedStats = await calculateAllStats();

            expect(calculatedStats.totalFlights).toBe(4); // Total flights from logs
            expect(calculatedStats.totalFlightTimeMinutes).toBe(70);
            expect(calculatedStats.averageFlightTimeMinutes).toBeCloseTo(17.5);

            // Only drones found in logs should appear, marked appropriately
            expect(calculatedStats.statsByDrone).toHaveLength(3); // d1, d2, d_deleted

            const statsD1 = calculatedStats.statsByDrone.find(s => s.droneId === 'd1');
            expect(statsD1).toBeDefined();
            // Because drone d1 doesn't exist in droneService.getAllDrones, name comes from log
            expect(statsD1?.droneName).toBe('Deleted Drone: Mavic Mini');
            expect(statsD1?.flightCount).toBe(2);

            const statsD2 = calculatedStats.statsByDrone.find(s => s.droneId === 'd2');
            expect(statsD2).toBeDefined();
            expect(statsD2?.droneName).toBe('Deleted Drone: Air 2S');
            expect(statsD2?.flightCount).toBe(1);

             const statsDeleted = calculatedStats.statsByDrone.find(s => s.droneId === 'd_deleted');
             expect(statsDeleted).toBeDefined();
             expect(statsDeleted?.droneName).toBe('Deleted Drone: Old Phantom');
             expect(statsDeleted?.flightCount).toBe(1);

        });

        it('should handle errors during log fetching', async () => {
            (flightLogService.getAllFlightLogs as MockedFunction<any>).mockRejectedValue(new Error('DB Log Error'));
            await expect(calculateAllStats()).rejects.toThrow('DB Log Error');
        });

        it('should handle errors during drone fetching', async () => {
            (droneService.getAllDrones as MockedFunction<any>).mockRejectedValue(new Error('DB Drone Error'));
            await expect(calculateAllStats()).rejects.toThrow('DB Drone Error');
        });

    });
}); 