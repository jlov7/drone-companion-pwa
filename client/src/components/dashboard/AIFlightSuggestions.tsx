import { useAiSuggestions } from "@/lib/useFlights";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlightPlan } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPinIcon, ClockIcon, BatteryFullIcon, CloudIcon } from "lucide-react";

interface AIFlightSuggestionsProps {
  userId: number;
  onUseFlightPlan: (planId: number) => void;
  onGenerateCustomPlan: () => void;
}

export default function AIFlightSuggestions({ 
  userId, 
  onUseFlightPlan,
  onGenerateCustomPlan
}: AIFlightSuggestionsProps) {
  const { 
    data: suggestions, 
    isLoading, 
    error 
  } = useAiSuggestions(userId, 2);

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="bg-primary-50 rounded-lg p-4 mb-4">
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Skeleton className="h-6 w-6 mr-3" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex space-x-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="bg-primary-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-secondary-700">
          Based on your flight history, weather conditions, and battery status, our AI recommends the following flight plans:
        </p>
      </div>
      
      <div className="space-y-4">
        {suggestions && suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <SuggestionCard 
              key={suggestion.id} 
              suggestion={suggestion} 
              onUseFlightPlan={onUseFlightPlan} 
            />
          ))
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No flight suggestions available.</p>
            <p className="text-sm text-gray-400 mt-1">Add more flight history for better recommendations.</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <Button 
          variant="link" 
          className="text-sm font-medium text-primary-600 hover:text-primary-800"
          onClick={onGenerateCustomPlan}
        >
          Generate Custom Flight Plan
        </Button>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: FlightPlan;
  onUseFlightPlan: (planId: number) => void;
}

function SuggestionCard({ suggestion, onUseFlightPlan }: SuggestionCardProps) {
  const getWeatherIcon = (weatherSuggestion: string | null | undefined) => {
    if (!weatherSuggestion) return null;
    
    const lowerCase = weatherSuggestion.toLowerCase();
    if (lowerCase.includes('good')) {
      return <CloudIcon className="h-4 w-4 mr-1 text-success" />;
    } else if (lowerCase.includes('wind')) {
      return <CloudIcon className="h-4 w-4 mr-1 text-warning" />;
    } else {
      return <CloudIcon className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-150">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <MapPinIcon className="h-6 w-6 text-primary-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-secondary-800">{suggestion.title}</h3>
          <div className="mt-1 text-sm text-gray-500">
            {suggestion.description || 'No description available'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center mr-3">
              {getWeatherIcon(suggestion.weatherSuggestion)}
              <span>{suggestion.weatherSuggestion || 'Weather data unavailable'}</span>
            </span>
            <span className="inline-flex items-center mr-3">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{suggestion.duration ? `~${suggestion.duration} minutes` : 'Duration unknown'}</span>
            </span>
            <span className="inline-flex items-center">
              <BatteryFullIcon className="h-4 w-4 mr-1" />
              <span>{suggestion.requiredBatteries ? `${suggestion.requiredBatteries} ${suggestion.requiredBatteries === 1 ? 'Battery' : 'Batteries'}` : 'Battery info unavailable'}</span>
            </span>
          </div>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-primary-700 border-primary-300 hover:text-primary-500"
            onClick={() => onUseFlightPlan(suggestion.id)}
          >
            Use Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
