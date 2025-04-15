import { useQuery, useMutation } from '@tanstack/react-query';
import { dronesApi } from './api';
import { queryClient } from './queryClient';

export function useDrones(userId: number) {
  return useQuery({
    queryKey: [`/api/drones?userId=${userId}`],
    enabled: !!userId
  });
}

export function useDrone(id: number) {
  return useQuery({
    queryKey: [`/api/drones/${id}`],
    enabled: !!id
  });
}

export function useCreateDrone(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (drone: any) => dronesApi.createDrone(drone),
    onSuccess: (data, variables) => {
      // Invalidate drones query
      queryClient.invalidateQueries({ 
        queryKey: [`/api/drones?userId=${variables.userId}`] 
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: [`/api/stats?userId=${variables.userId}`]
      });
      
      if (onSuccess) onSuccess();
    }
  });
}

export function useUpdateDrone(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      dronesApi.updateDrone(id, data),
    onSuccess: (data, variables) => {
      // Invalidate specific drone query
      queryClient.invalidateQueries({
        queryKey: [`/api/drones/${variables.id}`]
      });
      
      // Invalidate drones list query
      queryClient.invalidateQueries({
        queryKey: [`/api/drones`]
      });
      
      // Invalidate stats
      const drone = data as any;
      if (drone && drone.userId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/stats?userId=${drone.userId}`]
        });
      }
      
      if (onSuccess) onSuccess();
    }
  });
}

export function useDeleteDrone(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (id: number) => dronesApi.deleteDrone(id),
    onSuccess: (_data, id) => {
      // Invalidate specific drone query
      queryClient.invalidateQueries({
        queryKey: [`/api/drones/${id}`]
      });
      
      // Invalidate drones list query
      queryClient.invalidateQueries({
        queryKey: [`/api/drones`]
      });
      
      // We can't directly invalidate stats without knowing the userId,
      // but we can handle this in the UI component by invalidating stats there
      
      if (onSuccess) onSuccess();
    }
  });
}

// Status formatting function
export function formatDroneStatus(status: string): { 
  label: string; 
  color: string;
  bgColor: string;
  textColor: string;
} {
  switch (status) {
    case 'ready':
      return { 
        label: 'Ready to Fly',
        color: 'bg-success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-800'
      };
    case 'flying':
      return { 
        label: 'Currently Flying',
        color: 'bg-primary',
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-800'
      };
    case 'charging':
      return { 
        label: 'Charging',
        color: 'bg-accent',
        bgColor: 'bg-accent-100',
        textColor: 'text-accent-800'
      };
    case 'needs_calibration':
      return { 
        label: 'Needs Calibration',
        color: 'bg-warning',
        bgColor: 'bg-warning-100',
        textColor: 'text-warning-800'
      };
    case 'maintenance':
      return { 
        label: 'Needs Maintenance',
        color: 'bg-danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-800'
      };
    default:
      return { 
        label: 'Unknown',
        color: 'bg-gray-500',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
  }
}

// Format storage display
export function formatDroneStorage(used: number, total: number): string {
  if (!used || !total) return 'No data';
  
  const percentUsed = Math.round((used / total) * 100);
  const freeGB = ((total - used) / 1024).toFixed(0);
  
  return `${percentUsed}% (${freeGB}GB free)`;
}
