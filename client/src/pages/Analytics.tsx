import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { flightLogsApi } from "@/lib/api";
import { formatFlightDuration } from "@/lib/useFlights";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  Activity, 
  Timer, 
  Map, 
  Calendar, 
  Clock as ClockIcon,
  AlertTriangle,
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  Clock as Clock3,
  Plane as DroneIcon,
  Battery
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  BarChart2 as BarChart2Icon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Plane as PlaneIcon,
  BatteryFull as BatteryFullIcon,
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const userId = 1; // Hard-coded for demo purposes
  
  // State
  const [timeRange, setTimeRange] = useState("month");
  const [chartType, setChartType] = useState("flights");
  
  // Fetch stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: [`/api/stats?userId=${userId}`],
  });
  
  // Fetch flight logs for charts
  const {
    data: flightLogs,
    isLoading: isLoadingFlights,
    error: flightsError
  } = useQuery({
    queryKey: [`/api/flight-logs?userId=${userId}`],
  });
  
  // Handle errors
  if (statsError || flightsError) {
    toast({
      title: "Error",
      description: "Failed to load analytics data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Process data for charts
  const flightsByDate = flightLogs ? processFlightsByDate(flightLogs, timeRange) : [];
  const flightsByDrone = flightLogs ? processFlightsByDrone(flightLogs) : [];
  const flightsByLocation = flightLogs ? processFlightsByLocation(flightLogs) : [];
  const batteryUsageData = flightLogs ? processBatteryUsage(flightLogs) : [];
  
  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Process flight data by date
  function processFlightsByDate(logs: any[], timeRange: string) {
    if (!logs || logs.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on time range
    if (timeRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Filter logs by date range
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= startDate && logDate <= now;
    });
    
    // Group by date
    const groupedData: Record<string, { count: number, duration: number, distance: number }> = {};
    
    filteredLogs.forEach(log => {
      let dateKey: string;
      const logDate = new Date(log.createdAt);
      
      if (timeRange === "week") {
        // Group by day of week for the week view
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dateKey = dayNames[logDate.getDay()];
      } else if (timeRange === "month") {
        // Group by day for the month view
        dateKey = logDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        // Group by month for the year view
        dateKey = logDate.toLocaleDateString(undefined, { month: 'short' });
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { count: 0, duration: 0, distance: 0 };
      }
      
      groupedData[dateKey].count += 1;
      groupedData[dateKey].duration += log.duration || 0;
      groupedData[dateKey].distance += log.distance || 0;
    });
    
    // Convert to array for charts
    return Object.keys(groupedData).map(date => ({
      date,
      flights: groupedData[date].count,
      duration: groupedData[date].duration / 60, // Convert to minutes
      distance: groupedData[date].distance
    }));
  }
  
  // Process flight data by drone
  function processFlightsByDrone(logs: any[]) {
    if (!logs || logs.length === 0) return [];
    
    const droneData: Record<number, { count: number, drone: string, duration: number }> = {};
    
    logs.forEach(log => {
      if (!droneData[log.droneId]) {
        // Get drone name from log if available, or use ID
        const droneName = log.droneName || `Drone ${log.droneId}`;
        droneData[log.droneId] = { count: 0, drone: droneName, duration: 0 };
      }
      
      droneData[log.droneId].count += 1;
      droneData[log.droneId].duration += log.duration || 0;
    });
    
    return Object.values(droneData).sort((a, b) => b.count - a.count);
  }
  
  // Process flight data by location
  function processFlightsByLocation(logs: any[]) {
    if (!logs || logs.length === 0) return [];
    
    const locationData: Record<string, { count: number, location: string }> = {};
    
    logs.forEach(log => {
      if (!log.location) return;
      
      if (!locationData[log.location]) {
        locationData[log.location] = { count: 0, location: log.location };
      }
      
      locationData[log.location].count += 1;
    });
    
    return Object.values(locationData).sort((a, b) => b.count - a.count);
  }
  
  // Process battery usage data
  function processBatteryUsage(logs: any[]) {
    if (!logs || logs.length === 0) return [];
    
    const batteryData: Record<string, { usage: number, type: string }> = {
      "0-25%": { usage: 0, type: "0-25%" },
      "25-50%": { usage: 0, type: "25-50%" },
      "50-75%": { usage: 0, type: "50-75%" },
      "75-100%": { usage: 0, type: "75-100%" },
    };
    
    logs.forEach(log => {
      if (log.batteryUsed === undefined) return;
      
      if (log.batteryUsed <= 25) {
        batteryData["0-25%"].usage++;
      } else if (log.batteryUsed <= 50) {
        batteryData["25-50%"].usage++;
      } else if (log.batteryUsed <= 75) {
        batteryData["50-75%"].usage++;
      } else {
        batteryData["75-100%"].usage++;
      }
    });
    
    return Object.values(batteryData);
  }
  
  // Format number with commas
  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze your flight data and drone performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Flights</p>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{formatNumber(stats?.totalFlights || 0)}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <DroneIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Flight Hours</p>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.flightHours.toFixed(1) || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Max Distance</p>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.maxDistance.toFixed(1) || 0} km</p>
                )}
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <MapPinIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Drones</p>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.activeDrones || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <BatteryFullIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 mb-6">
        <Tabs value={chartType} onValueChange={setChartType}>
          <TabsList>
            <TabsTrigger value="flights">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Flight Trends
            </TabsTrigger>
            <TabsTrigger value="drones">
              <BarChart2Icon className="h-4 w-4 mr-2" />
              Drone Usage
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="battery">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Battery Usage
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 font-medium">Time Range:</div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {chartType === "flights" && "Flight Activity Trends"}
            {chartType === "drones" && "Drone Usage Comparison"}
            {chartType === "locations" && "Popular Flight Locations"}
            {chartType === "battery" && "Battery Usage Distribution"}
          </CardTitle>
          <CardDescription>
            {chartType === "flights" && "Number of flights and total flight time over the selected period"}
            {chartType === "drones" && "Compare usage metrics across your different drone models"}
            {chartType === "locations" && "Most frequently visited flight locations"}
            {chartType === "battery" && "Distribution of battery capacity usage during flights"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFlights ? (
            <div className="w-full h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Skeleton className="h-4 w-32 mx-auto mb-4" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </div>
            </div>
          ) : flightLogs && flightLogs.length > 0 ? (
            <div className="w-full h-[400px]">
              {chartType === "flights" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={flightsByDate}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" padding={{ left: 10, right: 10 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="flights"
                      name="Number of Flights"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="duration"
                      name="Flight Minutes"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {chartType === "drones" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={flightsByDrone}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="drone" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      name="Number of Flights"
                      fill="#8884d8"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="duration"
                      name="Total Minutes"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === "locations" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={flightsByLocation}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="location" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Flights" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === "battery" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={batteryUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="usage"
                      nameKey="type"
                    >
                      {batteryUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div className="w-full h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <BarChart2Icon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No flight data available</h3>
                <p className="text-gray-500">
                  Record some flights to see analytics and insights
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight Performance Metrics</CardTitle>
            <CardDescription>
              Analyze your flight performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFlights ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : flightLogs && flightLogs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500 mr-2" />
                    <span className="text-sm font-medium">Average Flight Duration</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatFlightDuration(stats?.averageFlightDuration || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-success-500 mr-2" />
                    <span className="text-sm font-medium">Average Flight Distance</span>
                  </div>
                  <span className="text-sm font-medium">
                    {(stats?.averageFlightDistance || 0).toFixed(2)} km
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-warning-500 mr-2" />
                    <span className="text-sm font-medium">Average Battery Usage</span>
                  </div>
                  <span className="text-sm font-medium">
                    {(stats?.averageBatteryUsage || 0).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
                    <span className="text-sm font-medium">Total Flights</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats?.totalFlights || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No flight data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Battery Performance</CardTitle>
            <CardDescription>
              Analyze your battery usage and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFlights ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : flightLogs && flightLogs.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Healthy Batteries</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Needs Calibration</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-warning-500 h-2 rounded-full" style={{ width: "10%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Degraded</span>
                    <span className="text-sm font-medium">4%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-accent-500 h-2 rounded-full" style={{ width: "4%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Critical</span>
                    <span className="text-sm font-medium">1%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-danger-500 h-2 rounded-full" style={{ width: "1%" }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No battery data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}