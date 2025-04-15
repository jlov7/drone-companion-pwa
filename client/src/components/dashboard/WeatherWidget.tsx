import { CloudIcon, Sparkles } from "lucide-react";
import WeatherGauge from "@/components/ui/WeatherGauge";
import { useWeather } from "@/lib/useWeather";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherComment } from "@/components/ai/WeatherComment";

interface WeatherWidgetProps {
  userId: number;
  location: string;
  onViewForecast: () => void;
}

export default function WeatherWidget({ userId, location, onViewForecast }: WeatherWidgetProps) {
  const { weatherData, isLoading, isError, error } = useWeather(userId, location);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-16 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="text-center text-danger p-4">
            <p>Failed to load weather data</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="text-center p-4">
            <CloudIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No weather data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Determine colors based on values
  const windColor = getConditionColor(weatherData.windSpeed, [10, 20, 25]);
  const visibilityColor = getConditionColor(weatherData.visibility, [5, 3, 1], true);
  const precipitationColor = getConditionColor(weatherData.precipitation, [20, 40, 60]);
  const uvColor = getConditionColor(weatherData.uvIndex, [3, 6, 8]);

  const flightConditionClass = weatherData.flightCondition?.includes('Good') 
    ? 'bg-success-100 border-success-200 text-success-800'
    : 'bg-warning-100 border-warning-200 text-warning-800';

  return (
    <div className="p-5">
      <div className="flex items-center mb-4">
        <div className="text-4xl text-secondary-800 font-light">
          {weatherData.temperature ? `${Math.round(weatherData.temperature)}°C` : 'N/A'}
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-secondary-700">{weatherData.condition || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{weatherData.location || 'Unknown location'}</div>
        </div>
        <div className="ml-auto">
          <CloudIcon className="h-12 w-12 text-accent-400" />
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Flying Conditions</h3>
        <div className={`border rounded-md p-3 text-sm ${flightConditionClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{weatherData.flightCondition || 'No flight condition data'}</span>
        </div>
      </div>
      
      {/* AI Weather Comment */}
      {weatherData.temperature && weatherData.condition && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-500">AI Flight Advice</h3>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
            <WeatherComment 
              weatherData={{
                temperature: weatherData.temperature,
                windSpeed: weatherData.windSpeed,
                condition: weatherData.condition,
                precipitation: weatherData.precipitation
              }} 
            />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-medium text-gray-500">Wind Speed</div>
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
            <div className="text-sm font-medium text-gray-500">Visibility</div>
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
            <div className="text-sm font-medium text-gray-500">Precipitation</div>
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
            <div className="text-sm font-medium text-gray-500">UV Index</div>
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
      
      <div className="mt-4 text-center">
        <Button 
          variant="link" 
          className="text-sm font-medium text-primary-600 hover:text-primary-800"
          onClick={onViewForecast}
        >
          View Detailed Forecast
        </Button>
      </div>
    </div>
  );
}

function getUvDescription(uvIndex: number): string {
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
}
