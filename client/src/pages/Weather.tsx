import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWeather } from "@/lib/useWeather";
import { weatherApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import WeatherGauge from "@/components/ui/WeatherGauge";
import WeatherForecast from "@/components/weather/WeatherForecast";

import {
  CloudIcon,
  SearchIcon,
  MapPinIcon,
  RefreshCw,
  Wind,
  ArrowUpIcon,
  SunIcon,
  CloudRainIcon,
  AlertCircleIcon,
  ThermometerIcon,
  EyeIcon,
  UmbrellaIcon,
  SaveIcon,
} from "lucide-react";

export default function Weather() {
  const { toast } = useToast();
  
  // State
  const [location, setLocation] = useState<string>("San Francisco, CA");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [savedLocations, setSavedLocations] = useState<string[]>([
    "San Francisco, CA", 
    "New York, NY", 
    "Los Angeles, CA"
  ]);
  
  const userId = 1; // Hard-coded for demo purposes
  
  // Get weather data for current location
  const { 
    weatherData, 
    isLoading: isLoadingWeather, 
    error: weatherError, 
    refetch 
  } = useWeather(userId, location);
  
  // Handle errors
  useEffect(() => {
    if (weatherError) {
      toast({
        title: "Error loading weather data",
        description: weatherError instanceof Error ? weatherError.message : "Failed to load weather data",
        variant: "destructive",
      });
    }
  }, [weatherError, toast]);
  
  // Save weather data mutation
  const saveWeatherMutation = useMutation({
    mutationFn: (data: any) => weatherApi.saveWeatherData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/weather?userId=${userId}&location=${encodeURIComponent(location)}`] 
      });
      toast({
        title: "Location Saved",
        description: `${location} has been added to your saved locations.`,
      });
      
      // Update saved locations
      if (!savedLocations.includes(location)) {
        setSavedLocations([...savedLocations, location]);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save location",
        variant: "destructive",
      });
    },
  });
  
  // Handle search
  const handleSearch = () => {
    if (searchLocation.trim()) {
      setLocation(searchLocation.trim());
      setSearchLocation("");
    }
  };
  
  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  // Handle save location
  const handleSaveLocation = () => {
    if (weatherData) {
      saveWeatherMutation.mutate(weatherData);
    }
  };
  
  // Get condition color
  const getConditionColor = (value: number, thresholds: number[], isInverted = false) => {
    const colors = ['bg-success', 'bg-accent', 'bg-warning', 'bg-danger'];
    let index = 0;
    
    for (let i = 0; i < thresholds.length; i++) {
      if ((isInverted && value < thresholds[i]) || (!isInverted && value > thresholds[i])) {
        index = i + 1;
      }
    }
    
    return colors[Math.min(index, colors.length - 1)];
  };
  
  // Get UV description
  const getUvDescription = (uvIndex: number): string => {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  };
  
  // Determine if conditions are safe for flying
  const isSafeToFly = (data: any): boolean => {
    if (!data) return false;
    
    return data.windSpeed < 20 && // Less than 20 km/h wind
           data.precipitation < 30 && // Less than 30% precipitation chance
           data.visibility > 5; // More than 5km visibility
  };
  
  // Get flight recommendations based on weather
  const getFlightRecommendations = (data: any): string[] => {
    if (!data) return [];
    
    const recommendations: string[] = [];
    
    if (data.windSpeed > 15) {
      recommendations.push("High winds detected. Consider using a drone with strong wind resistance.");
    }
    
    if (data.precipitation > 10) {
      recommendations.push("Precipitation possible. Ensure your drone has adequate waterproofing if flying.");
    }
    
    if (data.visibility < 8) {
      recommendations.push("Reduced visibility. Maintain visual line of sight and consider using tracking features.");
    }
    
    if (data.uvIndex > 6) {
      recommendations.push("High UV levels. Be aware that strong sunlight may affect camera visibility and your ability to see the drone's screen.");
    }
    
    if (isSafeToFly(data)) {
      recommendations.push("Overall good conditions for flying. Enjoy your flight!");
    } else {
      recommendations.push("Weather conditions are not ideal for flying. Consider postponing or take extra precautions.");
    }
    
    return recommendations;
  };
  
  // Determine colors based on values
  const windColor = weatherData ? getConditionColor(weatherData.windSpeed, [10, 20, 25]) : 'bg-gray-200';
  const visibilityColor = weatherData ? getConditionColor(weatherData.visibility, [5, 3, 1], true) : 'bg-gray-200';
  const precipitationColor = weatherData ? getConditionColor(weatherData.precipitation, [20, 40, 60]) : 'bg-gray-200';
  const uvColor = weatherData ? getConditionColor(weatherData.uvIndex, [3, 6, 8]) : 'bg-gray-200';
  
  const flightConditionClass = weatherData?.flightCondition?.includes('Good') 
    ? 'bg-success-100 border-success-200 text-success-800'
    : 'bg-warning-100 border-warning-200 text-warning-800';
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Weather Conditions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Check current weather conditions for safe drone flying
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-96">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search location..."
              className="pl-10 pr-24"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-3 py-1 h-8"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 flex-nowrap">
            {savedLocations.map((loc) => (
              <Button
                key={loc}
                variant={location === loc ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setLocation(loc)}
              >
                <MapPinIcon className="h-4 w-4 mr-1" />
                {loc}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Conditions</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="flight">Flight Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {location}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        onClick={handleSaveLocation}
                        disabled={saveWeatherMutation.isPending || !weatherData}
                      >
                        <SaveIcon className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Current weather conditions
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoadingWeather}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoadingWeather ? (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center md:w-1/2">
                      <Skeleton className="h-20 w-20 rounded-lg" />
                      <div className="ml-4 space-y-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : weatherData ? (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center md:w-1/2">
                      <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {weatherData.condition?.toLowerCase().includes('clear') || weatherData.condition?.toLowerCase().includes('sun') ? (
                          <SunIcon className="h-12 w-12" />
                        ) : weatherData.condition?.toLowerCase().includes('rain') ? (
                          <CloudRainIcon className="h-12 w-12" />
                        ) : (
                          <CloudIcon className="h-12 w-12" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-4xl font-light text-secondary-800">
                          {Math.round(weatherData.temperature)}°C
                        </div>
                        <div className="text-lg text-secondary-600">
                          {weatherData.condition || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Flying Conditions</h3>
                        <div className={`border rounded-md p-3 text-sm ${flightConditionClass}`}>
                          {isSafeToFly(weatherData) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <AlertCircleIcon className="h-5 w-5 inline-block mr-1" />
                          )}
                          <span>{weatherData.flightCondition || 'No flight condition data'}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-gray-500 flex items-center">
                              <Wind className="h-4 w-4 mr-1" />
                              Wind Speed
                            </div>
                            <div className="text-sm font-medium text-secondary-700">
                              {weatherData.windSpeed ? `${weatherData.windSpeed.toFixed(1)} km/h` : 'N/A'}
                            </div>
                          </div>
                          <WeatherGauge 
                            value={weatherData.windSpeed || 0} 
                            maxValue={30} 
                            color={windColor} 
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-gray-500 flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Visibility
                            </div>
                            <div className="text-sm font-medium text-secondary-700">
                              {weatherData.visibility ? `${weatherData.visibility.toFixed(1)} km` : 'N/A'}
                            </div>
                          </div>
                          <WeatherGauge 
                            value={weatherData.visibility || 0} 
                            maxValue={10} 
                            color={visibilityColor} 
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-gray-500 flex items-center">
                              <UmbrellaIcon className="h-4 w-4 mr-1" />
                              Precipitation
                            </div>
                            <div className="text-sm font-medium text-secondary-700">
                              {weatherData.precipitation !== undefined ? `${weatherData.precipitation}%` : 'N/A'}
                            </div>
                          </div>
                          <WeatherGauge 
                            value={weatherData.precipitation || 0} 
                            maxValue={100} 
                            color={precipitationColor} 
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-gray-500 flex items-center">
                              <SunIcon className="h-4 w-4 mr-1" />
                              UV Index
                            </div>
                            <div className="text-sm font-medium text-secondary-700">
                              {weatherData.uvIndex !== undefined 
                                ? `${weatherData.uvIndex} (${getUvDescription(weatherData.uvIndex)})` 
                                : 'N/A'}
                            </div>
                          </div>
                          <WeatherGauge 
                            value={weatherData.uvIndex || 0} 
                            maxValue={12} 
                            color={uvColor} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CloudIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-800 mb-1">No weather data available</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      Unable to retrieve weather data for {location}
                    </p>
                    <Button onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weather Alerts</CardTitle>
                <CardDescription>
                  Important conditions to be aware of
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoadingWeather ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex">
                        <Skeleton className="h-6 w-6 mr-3" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    {weatherData.windSpeed > 20 && (
                      <div className="flex p-3 bg-warning-50 text-warning-800 rounded-md">
                        <AlertCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">High Winds Alert</p>
                          <p className="text-sm mt-1">Wind speeds of {Math.round(weatherData.windSpeed)} km/h may affect drone stability.</p>
                        </div>
                      </div>
                    )}
                    
                    {weatherData.precipitation > 30 && (
                      <div className="flex p-3 bg-warning-50 text-warning-800 rounded-md">
                        <CloudRainIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Precipitation Alert</p>
                          <p className="text-sm mt-1">{weatherData.precipitation}% chance of precipitation may damage non-waterproof drones.</p>
                        </div>
                      </div>
                    )}
                    
                    {weatherData.visibility < 5 && (
                      <div className="flex p-3 bg-warning-50 text-warning-800 rounded-md">
                        <EyeIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Low Visibility Alert</p>
                          <p className="text-sm mt-1">Visibility of {weatherData.visibility.toFixed(1)} km may affect visual line of sight.</p>
                        </div>
                      </div>
                    )}
                    
                    {weatherData.uvIndex > 8 && (
                      <div className="flex p-3 bg-warning-50 text-warning-800 rounded-md">
                        <SunIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">High UV Alert</p>
                          <p className="text-sm mt-1">UV index of {weatherData.uvIndex} may cause screen visibility issues.</p>
                        </div>
                      </div>
                    )}
                    
                    {isSafeToFly(weatherData) && !(weatherData.windSpeed > 20 || weatherData.precipitation > 30 || weatherData.visibility < 5 || weatherData.uvIndex > 8) && (
                      <div className="flex p-3 bg-success-50 text-success-800 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium">Good Flying Conditions</p>
                          <p className="text-sm mt-1">Weather conditions are favorable for drone flights.</p>
                        </div>
                      </div>
                    )}
                    
                    {!isSafeToFly(weatherData) && !(weatherData.windSpeed > 20 || weatherData.precipitation > 30 || weatherData.visibility < 5 || weatherData.uvIndex > 8) && (
                      <div className="flex p-3 bg-gray-50 text-gray-800 rounded-md">
                        <InfoIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Mixed Conditions</p>
                          <p className="text-sm mt-1">Some conditions may affect drone flight. Check detailed metrics.</p>
                        </div>
                      </div>
                    )}
                    
                    {!(weatherData.windSpeed > 20 || weatherData.precipitation > 30 || weatherData.visibility < 5 || weatherData.uvIndex > 8) && !isSafeToFly(weatherData) && (
                      <div className="flex p-3 bg-gray-50 text-gray-800 rounded-md">
                        <InfoIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">No Specific Alerts</p>
                          <p className="text-sm mt-1">No major weather concerns detected.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No weather alerts available</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <p className="text-xs text-gray-500">
                  Weather data last updated: {weatherData ? new Date(weatherData.timestamp).toLocaleString() : 'N/A'}
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Hourly Forecast</CardTitle>
              <CardDescription>
                Weather conditions over the next few hours
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoadingWeather ? (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex-shrink-0 w-24 text-center space-y-2">
                      <Skeleton className="h-4 w-16 mx-auto" />
                      <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                      <Skeleton className="h-5 w-12 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : weatherData ? (
                // This would typically come from a forecast API
                // Mock hourly forecast based on current data for demonstration
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {[0, 1, 2, 3, 4, 5].map((hour) => {
                    const time = new Date();
                    time.setHours(time.getHours() + hour);
                    
                    // Slightly vary the temperature and conditions for mock forecast
                    const tempVariation = Math.random() * 4 - 2; // -2 to +2 degrees
                    const windVariation = Math.random() * 6 - 3; // -3 to +3 km/h
                    
                    return (
                      <div key={hour} className="flex-shrink-0 w-24 text-center">
                        <div className="text-sm font-medium mb-2">
                          {time.getHours()}:00
                        </div>
                        <div className="w-12 h-12 mx-auto bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                          {weatherData.condition?.toLowerCase().includes('clear') || weatherData.condition?.toLowerCase().includes('sun') ? (
                            <SunIcon className="h-6 w-6" />
                          ) : weatherData.condition?.toLowerCase().includes('rain') ? (
                            <CloudRainIcon className="h-6 w-6" />
                          ) : (
                            <CloudIcon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="text-lg font-medium mt-1">
                          {Math.round(weatherData.temperature + tempVariation)}°
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-center mt-1">
                          <Wind className="h-3 w-3 mr-1" />
                          {Math.round(weatherData.windSpeed + windVariation)} km/h
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No forecast data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecast" className="mt-6">
          <WeatherForecast 
            location={location} 
            userId={userId}
            isLoading={isLoadingWeather}
            currentWeather={weatherData}
          />
        </TabsContent>
        
        <TabsContent value="flight" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flight Recommendations</CardTitle>
              <CardDescription>
                Based on current weather conditions for {location}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoadingWeather ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex">
                      <Skeleton className="h-8 w-8 rounded-full mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : weatherData ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
                    <h3 className="text-lg font-medium text-primary-800 mb-2">Flight Safety Summary</h3>
                    <p className="text-sm text-primary-700">
                      {isSafeToFly(weatherData) 
                        ? "Current weather conditions are generally favorable for drone flights."
                        : "Current weather conditions may present challenges for drone flights. Take precautions if flying."}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${weatherData.windSpeed < 20 ? 'bg-success' : 'bg-warning'}`}></div>
                        <span className="text-sm">Wind: {weatherData.windSpeed < 10 ? 'Low' : weatherData.windSpeed < 20 ? 'Moderate' : 'High'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${weatherData.precipitation < 30 ? 'bg-success' : 'bg-warning'}`}></div>
                        <span className="text-sm">Precipitation: {weatherData.precipitation < 10 ? 'Low' : weatherData.precipitation < 30 ? 'Moderate' : 'High'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${weatherData.visibility > 5 ? 'bg-success' : 'bg-warning'}`}></div>
                        <span className="text-sm">Visibility: {weatherData.visibility > 8 ? 'Excellent' : weatherData.visibility > 5 ? 'Good' : 'Poor'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${weatherData.uvIndex < 6 ? 'bg-success' : 'bg-warning'}`}></div>
                        <span className="text-sm">UV Level: {getUvDescription(weatherData.uvIndex)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                    
                    <div className="space-y-4">
                      {getFlightRecommendations(weatherData).map((recommendation, index) => (
                        <div key={index} className="flex">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-secondary-800">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h3 className="text-md font-medium mb-2">Best Time to Fly Today</h3>
                    
                    {isSafeToFly(weatherData) ? (
                      <div className="flex items-center text-success">
                        <CheckIcon className="h-5 w-5 mr-2" />
                        <p>Current conditions are suitable for flying</p>
                      </div>
                    ) : (
                      <div className="flex items-center text-warning-600">
                        <AlertCircleIcon className="h-5 w-5 mr-2" />
                        <p>Conditions may improve later in the day. Check back for updates.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircleIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-secondary-800 mb-1">No recommendation data available</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Unable to provide flight recommendations without weather data
                  </p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <p className="text-xs text-gray-500">
                Recommendations are based on general guidelines and should be used alongside your own judgment.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
