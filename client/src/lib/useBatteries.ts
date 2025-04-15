import { useQuery, useMutation } from '@tanstack/react-query';
import { batteriesApi } from './api';
import { queryClient } from './queryClient';

export function useBatteries(userId: number) {
  return useQuery({
    queryKey: [`/api/batteries?userId=${userId}`],
    enabled: !!userId
  });
}

export function useBatteriesByDrone(droneId: number) {
  return useQuery({
    queryKey: [`/api/batteries?droneId=${droneId}`],
    enabled: !!droneId
  });
}

export function useCreateBattery(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (battery: any) => batteriesApi.createBattery(battery),
    onSuccess: (data, variables) => {
      // Invalidate batteries query
      queryClient.invalidateQueries({ 
        queryKey: [`/api/batteries?userId=${variables.userId}`] 
      });
      
      // If battery is associated with a drone, invalidate drone-specific batteries
      if (variables.droneId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/batteries?droneId=${variables.droneId}`]
        });
      }
      
      if (onSuccess) onSuccess();
    }
  });
}

export function useUpdateBattery(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      batteriesApi.updateBattery(id, data),
    onSuccess: (data, variables) => {
      // We need to invalidate all battery queries since we don't know
      // which specific lists this battery might be in
      queryClient.invalidateQueries({
        queryKey: [`/api/batteries`]
      });
      
      if (onSuccess) onSuccess();
    }
  });
}

// Format battery status
export function formatBatteryStatus(status: string): { 
  label: string; 
  color: string;
} {
  switch (status) {
    case 'healthy':
      return { 
        label: 'Healthy',
        color: 'bg-success-100 text-success-800'
      };
    case 'needs_calibration':
      return { 
        label: 'Needs Calibration',
        color: 'bg-warning-100 text-warning-800'
      };
    case 'degraded':
      return { 
        label: 'Degraded',
        color: 'bg-warning-100 text-warning-800'
      };
    case 'critical':
      return { 
        label: 'Critical',
        color: 'bg-danger-100 text-danger-800'
      };
    case 'retired':
      return { 
        label: 'Retired',
        color: 'bg-gray-100 text-gray-800'
      };
    default:
      return { 
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800'
      };
  }
}

// Get battery tips based on batteries
export function getBatteryTips(batteries: any[]): string[] {
  if (!batteries || batteries.length === 0) {
    return ['No batteries found. Add batteries to see tips.'];
  }
  
  const tips: string[] = [];
  
  // Check for batteries that need calibration
  const needsCalibration = batteries.filter(b => b.status === 'needs_calibration');
  if (needsCalibration.length > 0) {
    needsCalibration.forEach(battery => {
      tips.push(`${battery.name} needs calibration - connect to drone and run calibration cycle`);
    });
  }
  
  // Add general battery tips
  tips.push('For optimal battery life, store all batteries at 60-70% charge when not in use');
  
  // Check for degraded batteries
  const degraded = batteries.filter(b => b.health < 70);
  if (degraded.length > 0) {
    tips.push(`${degraded.length} batteries are showing significant degradation and may need replacement soon`);
  }
  
  return tips;
}
