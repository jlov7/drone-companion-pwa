import { useQuery, useMutation } from '@tanstack/react-query';
import { flightLogsApi } from './api';
import { queryClient } from './queryClient';

export function useFlightLogs(userId: number) {
  return useQuery({
    queryKey: [`/api/flight-logs?userId=${userId}`],
    enabled: !!userId
  });
}

export function useRecentFlightLogs(userId: number, limit: number = 5) {
  return useQuery({
    queryKey: [`/api/flight-logs?userId=${userId}&limit=${limit}`],
    enabled: !!userId
  });
}

export function useFlightLogsByDrone(droneId: number) {
  return useQuery({
    queryKey: [`/api/flight-logs?droneId=${droneId}`],
    enabled: !!droneId
  });
}

export function useCreateFlightLog(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (flightLog: any) => flightLogsApi.createFlightLog(flightLog),
    onSuccess: (data, variables) => {
      // Invalidate flight log queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/flight-logs?userId=${variables.userId}`] 
      });
      
      // Invalidate recent flight logs
      queryClient.invalidateQueries({
        queryKey: [`/api/flight-logs?userId=${variables.userId}&limit=`]
      });
      
      // Invalidate drone-specific logs
      queryClient.invalidateQueries({
        queryKey: [`/api/flight-logs?droneId=${variables.droneId}`]
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: [`/api/stats?userId=${variables.userId}`]
      });
      
      if (onSuccess) onSuccess();
    }
  });
}

export function useUpdateFlightLog(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      flightLogsApi.updateFlightLog(id, data),
    onSuccess: (data, variables) => {
      // Invalidate flight log queries
      queryClient.invalidateQueries({
        queryKey: [`/api/flight-logs`]
      });
      
      // Invalidate specific flight log
      queryClient.invalidateQueries({
        queryKey: [`/api/flight-logs/${variables.id}`]
      });
      
      if (onSuccess) onSuccess();
    }
  });
}

// Helper function to format flight duration
export function formatFlightDuration(seconds: number): string {
  if (!seconds) return '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes} min`;
}

// Helper function to get relative time (Today, Yesterday, etc.)
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const flightDate = new Date(date);
  
  const diffDays = Math.floor((now.getTime() - flightDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return flightDate.toLocaleDateString();
  }
}

// Flight plans and AI suggestions
export function useFlightPlans(userId: number) {
  return useQuery({
    queryKey: [`/api/flight-plans?userId=${userId}`],
    enabled: !!userId
  });
}

export function useAiSuggestions(userId: number, limit: number = 3) {
  return useQuery({
    queryKey: [`/api/flight-plans?userId=${userId}&aiSuggestions=true&limit=${limit}`],
    enabled: !!userId
  });
}
