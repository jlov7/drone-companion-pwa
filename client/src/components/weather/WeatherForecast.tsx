import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudFogIcon,
  CloudLightningIcon,
  WindIcon,
  UmbrellaIcon,
  ThermometerIcon,
  DropletIcon,
} from "lucide-react";

interface WeatherForecastProps {
  location: string;
  userId: number;
}

interface ForecastDay {
  date: string;
  day: string;
  condition: string;
  icon: string;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

export default function WeatherForecast({ location, userId }: WeatherForecastProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch forecast data
  useEffect(() => {
    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would make an API call
        // For demo purposes, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate 5-day forecast based on current date
        const forecastData = generateMockForecast(5);
        setForecast(forecastData);
      } catch (err) {
        console.error("Error fetching forecast:", err);
        setError("Failed to load forecast data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchForecast();
  }, [location, userId]);
  
  // Generate mock forecast data
  const generateMockForecast = (days: number): ForecastDay[] => {
    const conditions = [
      { condition: "Clear", icon: "sun" },
      { condition: "Partly Cloudy", icon: "cloud-sun" },
      { condition: "Cloudy", icon: "cloud" },
      { condition: "Rain", icon: "cloud-rain" },
      { condition: "Thunderstorm", icon: "cloud-lightning" },
    ];
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    
    return Array.from({ length: days }).map((_, index) => {
      const date = new Date();
      date.setDate(today.getDate() + index);
      
      const dayName = dayNames[date.getDay()];
      const conditionIndex = Math.floor(Math.random() * conditions.length);
      const selectedCondition = conditions[conditionIndex];
      
      // Base temperature on condition
      const baseTemp = selectedCondition.condition === "Clear" ? 25 : 
                      selectedCondition.condition === "Partly Cloudy" ? 22 :
                      selectedCondition.condition === "Cloudy" ? 19 :
                      selectedCondition.condition === "Rain" ? 17 :
                      15;
      
      // Add some randomness
      const tempHigh = baseTemp + Math.floor(Math.random() * 5);
      const tempLow = baseTemp - 5 - Math.floor(Math.random() * 3);
      
      // Precipitation based on condition
      const precipitation = selectedCondition.condition === "Clear" ? 0 :
                           selectedCondition.condition === "Partly Cloudy" ? 10 :
                           selectedCondition.condition === "Cloudy" ? 30 :
                           selectedCondition.condition === "Rain" ? 70 :
                           80;
      
      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        day: dayName,
        condition: selectedCondition.condition,
        icon: selectedCondition.icon,
        tempHigh,
        tempLow,
        precipitation,
        windSpeed: 5 + Math.floor(Math.random() * 15),
        humidity: 40 + Math.floor(Math.random() * 40),
      };
    });
  };
  
  // Get appropriate weather icon
  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <SunIcon className="h-8 w-8 text-amber-500" />;
      case "cloud-sun":
        return <CloudIcon className="h-8 w-8 text-sky-300" />;
      case "cloud":
        return <CloudIcon className="h-8 w-8 text-gray-400" />;
      case "cloud-rain":
        return <CloudRainIcon className="h-8 w-8 text-blue-500" />;
      case "cloud-lightning":
        return <CloudLightningIcon className="h-8 w-8 text-amber-600" />;
      case "cloud-snow":
        return <CloudSnowIcon className="h-8 w-8 text-sky-200" />;
      case "cloud-fog":
        return <CloudFogIcon className="h-8 w-8 text-gray-400" />;
      default:
        return <CloudIcon className="h-8 w-8 text-gray-400" />;
    }
  };
  
  // Get color for precipitation chance
  const getPrecipitationColor = (chance: number): string => {
    if (chance < 30) return "bg-success";
    if (chance < 60) return "bg-warning";
    return "bg-danger";
  };
  
  // Get flight condition class based on weather
  const getFlightConditionClass = (condition: string, precipitation: number, windSpeed: number): string => {
    if (
      (condition === "Clear" || condition === "Partly Cloudy") &&
      precipitation < 30 &&
      windSpeed < 15
    ) {
      return "text-success";
    } else if (
      (condition === "Cloudy" || condition === "Rain" || condition === "Thunderstorm") ||
      precipitation >= 50 ||
      windSpeed >= 20
    ) {
      return "text-danger";
    } else {
      return "text-warning";
    }
  };
  
  // Get flight recommendation
  const getFlightRecommendation = (condition: string, precipitation: number, windSpeed: number): string => {
    if (
      (condition === "Clear" || condition === "Partly Cloudy") &&
      precipitation < 30 &&
      windSpeed < 15
    ) {
      return "Good flying conditions";
    } else if (
      condition === "Thunderstorm" ||
      precipitation >= 70 ||
      windSpeed >= 25
    ) {
      return "Not recommended for flying";
    } else {
      return "Exercise caution if flying";
    }
  };
  
  return (
    <div>
      {error ? (
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4 text-danger-800">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">5-Day Forecast</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-5 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-medium">{day.day}</div>
                        <div className="text-xs text-gray-500">{day.date}</div>
                      </div>
                      {getWeatherIcon(day.icon)}
                    </div>
                    
                    <div className="text-sm font-medium mb-2">{day.condition}</div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">
                        <span className="text-danger">{day.tempHigh}°</span> /
                        <span className="text-gray-500"> {day.tempLow}°</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <WindIcon className="h-3 w-3 mr-1" />
                        {day.windSpeed} km/h
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center">
                          <UmbrellaIcon className="h-3 w-3 mr-1" />
                          <span>Precipitation</span>
                        </div>
                        <span>{day.precipitation}%</span>
                      </div>
                      <Progress 
                        value={day.precipitation} 
                        className="h-1" 
                        indicatorClassName={getPrecipitationColor(day.precipitation)}
                      />
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className={`text-xs font-medium ${getFlightConditionClass(day.condition, day.precipitation, day.windSpeed)}`}>
                        {getFlightRecommendation(day.condition, day.precipitation, day.windSpeed)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="bg-primary-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-primary-900 mb-2">Flight Planning Tips</h4>
            <ul className="text-xs text-primary-800 space-y-1">
              <li>• Plan flights during morning hours for more stable conditions</li>
              <li>• Check wind speeds before flying, especially for smaller drones</li>
              <li>• Avoid flying during precipitation or high humidity conditions</li>
              <li>• Be aware of changing weather conditions during longer flights</li>
              <li>• Consider how temperature affects battery performance</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}