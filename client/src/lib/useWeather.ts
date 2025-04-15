import { useQuery, useMutation } from '@tanstack/react-query';
import { weatherApi } from './api';
import { queryClient } from './queryClient';
import { useEffect, useState, useCallback } from 'react';

// Open-Meteo API types
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    apparent_temperature: string;
    is_day: string;
    precipitation: string;
    rain: string;
    showers: string;
    snowfall: string;
    weather_code: string;
    cloud_cover: string;
    pressure_msl: string;
    surface_pressure: string;
    wind_speed_10m: string;
    wind_direction_10m: string;
    wind_gusts_10m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
}

// Geocoding API types
interface GeocodingResponse {
  results: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code: string;
    country_code: string;
    admin1_id: number;
    admin2_id: number;
    admin3_id: number;
    admin4_id: number;
    timezone: string;
    population: number;
    postcodes: string[];
    country_id: number;
    country: string;
    admin1: string;
    admin2: string;
    admin3: string;
    admin4: string;
  }[];
}

// Weather code mapping
const weatherCodeToCondition: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

// Convert Open-Meteo data to our format
function convertOpenMeteoData(data: OpenMeteoResponse, location: string, userId: number): any {
  // Determine visibility based on weather code and cloud cover (estimate)
  let visibility = 10; // Default max visibility in km

  if (data.current.cloud_cover > 80) {
    visibility = 7;
  }
  
  if ([45, 48].includes(data.current.weather_code)) { // Fog conditions
    visibility = 2;
  }
  
  // Calculate UV index based on cloud cover and time of day (estimate)
  let uvIndex = 0;
  if (data.current.is_day) {
    uvIndex = Math.max(0, Math.min(10, 10 - Math.floor(data.current.cloud_cover / 20)));
  }
  
  // Precipitation probability estimate based on precipitation and cloud cover
  const precipitation = data.current.precipitation > 0 
    ? Math.min(100, Math.round(data.current.precipitation * 30 + data.current.cloud_cover / 2)) 
    : Math.floor(data.current.cloud_cover / 4);
  
  // Determine if conditions are good for flying
  const windSpeedKmh = data.current.wind_speed_10m; // Already in km/h
  const isSafeToDrone = 
    windSpeedKmh < 20 && // Wind speed below 20 km/h
    precipitation < 30 && // Less than 30% precipitation chance
    visibility > 5 && // Visibility better than 5km
    data.current.weather_code < 50; // No fog or precipitation
  
  return {
    userId,
    location: location,
    temperature: data.current.temperature_2m,
    condition: weatherCodeToCondition[data.current.weather_code] || 'Unknown',
    windSpeed: windSpeedKmh,
    visibility: visibility,
    precipitation: precipitation,
    uvIndex: uvIndex,
    flightCondition: isSafeToDrone ? 'Excellent' : 'Not ideal for flying',
    timestamp: new Date()
  };
}

// Get the user's current location using the browser's geolocation API
export function useCurrentLocation() {
  const [currentLocation, setCurrentLocation] = useState<{ 
    latitude: number;
    longitude: number;
    accuracy: number;
    locationName: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get location name from coordinates using reverse geocoding
  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Note: Open-Meteo doesn't have a true reverse geocoding API, so we'll use a formatted string
      // In a production app, you'd use a proper reverse geocoding service like Google Maps, MapBox, etc.
      return `Location at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      
      /* This would be the proper implementation with a working reverse geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return `${result.name}, ${result.country}`;
      } else {
        return "Unknown Location";
      }
      */
    } catch (error) {
      console.error("Error getting location name:", error);
      return "Current Location";
    }
  };

  // Function to get current location
  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      const locationName = await getLocationName(latitude, longitude);
      
      setCurrentLocation({
        latitude,
        longitude,
        accuracy,
        locationName
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting location');
      console.error('Error getting current location:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return { currentLocation, isLoading, error, getCurrentLocation };
}

// Hook for getting weather data using Open-Meteo API (free, no key required)
export function useWeather(userId: number, location?: string) {
  const { currentLocation, isLoading: locationLoading } = useCurrentLocation();
  
  // Use provided location or get from geolocation
  const finalLocation = location || (currentLocation?.locationName || 'Ashtead, Surrey');
  
  // Query for stored weather data
  const storedWeatherQuery = useQuery({
    queryKey: [`/api/weather?userId=${userId}&location=${encodeURIComponent(finalLocation)}`],
    enabled: !!userId && !!finalLocation
  });
  
  // First get coordinates for the location using geocoding API
  const geocodingQuery = useQuery({
    queryKey: [`geocoding-${finalLocation}`],
    queryFn: async () => {
      // Skip geocoding if we're using browser geolocation
      if (!location && currentLocation) {
        return {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: currentLocation.locationName || "Current Location",
          country: ""
        };
      }
      
      const locationToUse = location || finalLocation;
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationToUse)}&count=1&language=en&format=json`
        );
        
        if (!response.ok) {
          console.error(`Geocoding API error: ${response.statusText}`);
          // Fallback to default coordinates for San Francisco
          return {
            latitude: 37.7749,
            longitude: -122.4194,
            name: locationToUse,
            country: "United States"
          };
        }
        
        const data: GeocodingResponse = await response.json();
        if (!data.results || data.results.length === 0) {
          console.error(`Location not found: ${locationToUse}`);
          // Fallback to default coordinates for the requested location
          return {
            latitude: 37.7749,
            longitude: -122.4194,
            name: locationToUse,
            country: "United States"
          };
        }
        
        return data.results[0];
      } catch (error) {
        console.error("Geocoding API fetch failed:", error);
        // Fallback to default coordinates
        return {
          latitude: 37.7749,
          longitude: -122.4194,
          name: locationToUse,
          country: "United States"
        };
      }
    },
    enabled: !!userId && (!!location || !!currentLocation?.latitude),
    staleTime: 24 * 60 * 60 * 1000, // Cache geocoding results for 24 hours
    refetchOnWindowFocus: false
  });
  
  // Query for real-time weather data from Open-Meteo
  const openMeteoQuery = useQuery({
    queryKey: [`openmeteo-${finalLocation}`],
    queryFn: async () => {
      // Use either geocoding query results or direct coordinates from browser geolocation
      let latitude: number, longitude: number, locationName: string;
      
      if (geocodingQuery.data) {
        // Use geocoding results (from location search)
        latitude = geocodingQuery.data.latitude;
        longitude = geocodingQuery.data.longitude;
        locationName = `${geocodingQuery.data.name}, ${geocodingQuery.data.country}`;
      } else if (currentLocation) {
        // Use browser geolocation
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
        locationName = currentLocation.locationName || finalLocation;
      } else {
        // Fallback for direct calls without geocoding
        throw new Error('Location coordinates not available');
      }
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`
        );
        
        if (!response.ok) {
          console.error(`Open-Meteo API error: ${response.statusText}`);
          // Return mock data if API fails
          return {
            userId,
            location: locationName,
            temperature: 21.5,
            condition: 'Partly cloudy',
            windSpeed: 12.3,
            visibility: 8.5,
            precipitation: 20,
            uvIndex: 5,
            flightCondition: 'Excellent',
            timestamp: new Date()
          };
        }
        
        const data: OpenMeteoResponse = await response.json();
        return convertOpenMeteoData(data, locationName, userId);
      } catch (error) {
        console.error("Weather API fetch failed:", error);
        // Return mock data if API fails
        return {
          userId,
          location: locationName,
          temperature: 21.5,
          condition: 'Partly cloudy',
          windSpeed: 12.3,
          visibility: 8.5,
          precipitation: 20,
          uvIndex: 5,
          flightCondition: 'Excellent',
          timestamp: new Date()
        };
      }
    },
    enabled: !!userId && !!finalLocation && (!!geocodingQuery.data || !!currentLocation),
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
    refetchOnWindowFocus: false
  });
  
  // Define weather data type
  interface WeatherData {
    userId: number;
    location: string;
    temperature: number;
    condition: string;
    windSpeed: number;
    visibility: number;
    precipitation: number;
    uvIndex: number;
    flightCondition: string;
    timestamp: Date;
  }

  // Mutation for saving weather data
  const saveWeatherMutation = useMutation({
    mutationFn: (data: WeatherData) => weatherApi.saveWeatherData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/weather?userId=${userId}&location=${encodeURIComponent(finalLocation)}`]
      });
    }
  });
  
  // Save Open-Meteo data if available and different from stored data
  useEffect(() => {
    if (
      openMeteoQuery.isSuccess && 
      !openMeteoQuery.isPending && 
      !saveWeatherMutation.isPending
    ) {
      const openMeteoData = openMeteoQuery.data as WeatherData;
      const storedData = storedWeatherQuery.data as WeatherData | undefined;
      
      // Save data if:
      // 1. No stored data exists
      // 2. Stored data is more than 1 hour old
      // 3. Weather conditions have changed significantly
      const shouldSaveData = 
        !storedData || 
        (storedData.timestamp && 
         new Date(storedData.timestamp).getTime() < Date.now() - 60 * 60 * 1000) ||
        (storedData.temperature !== openMeteoData.temperature ||
         storedData.condition !== openMeteoData.condition ||
         storedData.windSpeed !== openMeteoData.windSpeed);
      
      if (shouldSaveData) {
        saveWeatherMutation.mutate(openMeteoData);
      }
    }
  }, [
    openMeteoQuery.data, 
    openMeteoQuery.isSuccess, 
    storedWeatherQuery.data,
    saveWeatherMutation,
    userId,
    finalLocation
  ]);
  
  // Return the most recent weather data
  const weatherData = openMeteoQuery.isSuccess ? openMeteoQuery.data : storedWeatherQuery.data;
  
  return {
    weatherData,
    isLoading: geocodingQuery.isLoading || openMeteoQuery.isLoading || storedWeatherQuery.isLoading,
    isError: (geocodingQuery.isError || openMeteoQuery.isError) && storedWeatherQuery.isError,
    error: geocodingQuery.error || openMeteoQuery.error || storedWeatherQuery.error,
    refetch: () => {
      geocodingQuery.refetch();
      openMeteoQuery.refetch();
      storedWeatherQuery.refetch();
    }
  };
}
