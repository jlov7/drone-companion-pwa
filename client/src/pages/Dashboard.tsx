import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { statsApi } from "@/lib/api";
import { useDrones } from "@/lib/useDrones";
import { useRecentFlightLogs } from "@/lib/useFlights";
import { useState, useEffect } from "react";

// Dashboard components
import StatCard from "@/components/dashboard/StatCard";
import DroneStatus from "@/components/dashboard/DroneStatus";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import FlightLog from "@/components/dashboard/FlightLog";
import FlightMap from "@/components/dashboard/FlightMap";
import BatteryManagement from "@/components/dashboard/BatteryManagement";
import AIFlightSuggestions from "@/components/dashboard/AIFlightSuggestions";
import CustomFlightPlanModal from "@/components/dashboard/CustomFlightPlanModal";

// AI components
import { AchievementSuggestion } from "@/components/ai/AchievementSuggestion";
import { DroneFact } from "@/components/ai/DroneFact";
import { WeatherComment } from "@/components/ai/WeatherComment";

// Icons
import {
  PlaneTakeoffIcon,
  ClockIcon,
  MapPinIcon,
  Bot,
  CornerDownRight,
  Skull,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<{ id: number; model: string } | null>(null);
  
  // Hard-coded user ID for demo purposes
  // In a real app, this would come from authentication
  const userId = 1;
  
  // Default location for weather
  const defaultLocation = "San Francisco, CA";
  
  // Stats data
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: [`/api/stats?userId=${userId}`],
    enabled: !!userId
  });
  
  // Drones data
  const { 
    data: drones, 
    isLoading: isLoadingDrones,
    error: dronesError
  } = useDrones(userId);
  
  // Recent flight logs
  const { 
    data: recentFlights, 
    isLoading: isLoadingFlights,
    error: flightsError
  } = useRecentFlightLogs(userId, 3);
  
  // Handle errors
  if (statsError || dronesError || flightsError) {
    toast({
      title: "Error loading dashboard data",
      description: "Please check your connection and try again.",
      variant: "destructive",
    });
  }

  // Select the first drone if available
  useEffect(() => {
    if (drones && drones.length > 0 && !selectedDrone) {
      setSelectedDrone({
        id: drones[0].id,
        model: drones[0].model || 'Unknown model'
      });
    }
  }, [drones, selectedDrone]);
  
  // Navigation handlers
  const handleViewDroneDetails = (droneId: number) => {
    setLocation(`/drones/${droneId}`);
  };
  
  const handleViewFlightDetails = (flightId: number) => {
    setLocation(`/flights/${flightId}`);
  };
  
  const handleViewAllDrones = () => {
    setLocation('/drones');
  };
  
  const handleViewAllFlights = () => {
    setLocation('/flights');
  };
  
  const handleViewWeatherForecast = () => {
    setLocation('/weather');
  };
  
  const handleViewAllBatteries = () => {
    setLocation('/battery');
  };
  
  const handlePlanFlight = () => {
    setLocation('/planning');
  };
  
  const handleUseFlightPlan = (planId: number) => {
    setLocation(`/planning?plan=${planId}`);
  };
  
  const handleGenerateCustomPlan = () => {
    setShowCustomPlanModal(true);
  };
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back! Here's an overview of your drone activity.</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {isLoadingStats ? (
          // Loading skeletons
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center">
                  <Skull className="h-10 w-10 rounded-md" />
                  <div className="ml-4 space-y-2">
                    <Skull className="h-4 w-24" />
                    <Skull className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          // Actual stats
          <>
            <StatCard
              title="Total Flights"
              value={stats?.totalFlights || 0}
              icon={<PlaneTakeoffIcon className="h-6 w-6" />}
              change={{ value: "12%", isPositive: true }}
            />
            <StatCard
              title="Flight Hours"
              value={stats?.flightHours || 0}
              icon={<ClockIcon className="h-6 w-6" />}
              change={{ value: "8%", isPositive: true }}
            />
            <StatCard
              title="Max Distance"
              value={`${stats?.maxDistance || 0} km`}
              icon={<MapPinIcon className="h-6 w-6" />}
              change={{ value: "23%", isPositive: true }}
            />
            <StatCard
              title="Active Drones"
              value={stats?.activeDrones || 0}
              icon={<Bot className="h-6 w-6" />}
              change={{ value: "1", isPositive: true }}
            />
          </>
        )}
      </div>

      {/* Drones & Weather Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Drone Status */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-medium text-secondary-900">Drone Status</h2>
          </div>
          <div className="p-5">
            {isLoadingDrones ? (
              // Loading skeletons
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Skull className="h-6 w-24 rounded-full" />
                        <Skull className="h-4 w-32 ml-3" />
                      </div>
                      <Skull className="h-8 w-24" />
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap">
                      <div className="w-full md:w-1/2 lg:w-2/5 mr-4 space-y-2">
                        <Skull className="h-5 w-32" />
                        <Skull className="h-4 w-40" />
                        <Skull className="h-6 w-full" />
                      </div>
                      <div className="w-full md:w-1/2 lg:w-3/5 mt-4 md:mt-0">
                        <div className="grid grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j}>
                              <Skull className="h-3 w-20" />
                              <Skull className="h-5 w-24 mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : drones && drones.length > 0 ? (
              // Actual drone status
              drones.slice(0, 2).map((drone) => (
                <DroneStatus
                  key={drone.id}
                  drone={drone}
                  onViewDetails={handleViewDroneDetails}
                />
              ))
            ) : (
              // No drones state
              <div className="text-center p-6 bg-gray-50 rounded-lg mb-4">
                <p className="text-gray-500">No drones found.</p>
                <CornerDownRight 
                  variant="link" 
                  className="text-primary-600 mt-2"
                  onClick={() => setLocation('/drones/add')}
                >
                  Add your first drone
                </CornerDownRight>
              </div>
            )}
            <button 
              className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-800 border border-gray-300 rounded-md text-center"
              onClick={handleViewAllDrones}
            >
              View All Drones
            </button>
          </div>
        </div>
        
        {/* Weather Conditions */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-medium text-secondary-900">Weather Conditions</h2>
          </div>
          <WeatherWidget 
            userId={userId} 
            location={defaultLocation} 
            onViewForecast={handleViewWeatherForecast} 
          />
        </div>
      </div>
      
      {/* Recent Flights and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Flights */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">Recent Flights</h2>
            <button 
              className="text-sm font-medium text-primary-600 hover:text-primary-800"
              onClick={handleViewAllFlights}
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoadingFlights ? (
              // Loading skeletons
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Skull className="h-5 w-32" />
                      <Skull className="h-5 w-16 rounded-full" />
                    </div>
                    <Skull className="h-4 w-3/4 mb-3" />
                    <div className="flex items-center">
                      <Skull className="h-10 w-10 rounded-md" />
                      <div className="ml-3">
                        <Skull className="h-4 w-24" />
                        <Skull className="h-3 w-32 mt-1" />
                      </div>
                      <Skull className="h-8 w-8 ml-auto" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentFlights && recentFlights.length > 0 ? (
              // Actual flight logs
              recentFlights.map((flight) => (
                <FlightLog
                  key={flight.id}
                  flight={flight}
                  onViewDetails={handleViewFlightDetails}
                />
              ))
            ) : (
              // No flights state
              <div className="text-center p-6">
                <p className="text-gray-500">No flight logs found.</p>
                <CornerDownRight 
                  variant="link" 
                  className="text-primary-600 mt-2"
                  onClick={() => setLocation('/flights/new')}
                >
                  Log your first flight
                </CornerDownRight>
              </div>
            )}
          </div>
        </div>
        
        {/* Flight Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-medium text-secondary-900">Flight Map</h2>
          </div>
          <div className="p-5">
            <FlightMap userId={userId} onPlanFlight={handlePlanFlight} />
          </div>
        </div>
      </div>
      
      {/* Battery Management & AI Flight Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Battery Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">Battery Management</h2>
            <button 
              className="text-sm font-medium text-primary-600 hover:text-primary-800"
              onClick={handleViewAllBatteries}
            >
              View All
            </button>
          </div>
          <BatteryManagement userId={userId} onViewAll={handleViewAllBatteries} />
        </div>
        
        {/* AI Flight Suggestions */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">AI Flight Suggestions</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Beta
            </span>
          </div>
          <AIFlightSuggestions 
            userId={userId} 
            onUseFlightPlan={handleUseFlightPlan} 
            onGenerateCustomPlan={handleGenerateCustomPlan} 
          />
        </div>
      </div>
      
      {/* AI Insights Section */}
      <div className="mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-secondary-900">AI Insights</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Personalized insights powered by Gemini AI</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievement Suggestion */}
        <AchievementSuggestion />
        
        {/* Drone Fact */}
        <DroneFact />
      </div>

      {/* Custom Flight Plan Modal */}
      <CustomFlightPlanModal
        open={showCustomPlanModal}
        onOpenChange={setShowCustomPlanModal}
        userId={userId}
        drone={selectedDrone}
        weatherData={{
          temperature: 21,
          windSpeed: 8,
          condition: "Clear",
          precipitation: 0
        }}
      />
    </div>
  );
}
