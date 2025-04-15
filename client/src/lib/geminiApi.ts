import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

// Define model types
export interface GeminiModel {
  name: string;
  version?: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiModelList {
  models: GeminiModel[];
}

// Simplified model type for regular users
export interface SimpleGeminiModel {
  name: string;
  displayName: string;
  description: string;
}

// Function to fetch available Gemini models
export async function fetchGeminiModels(): Promise<GeminiModel[]> {
  try {
    // Fetch models using our API endpoint that will call Gemini's API
    const response = await apiRequest('/api/admin/gemini/models', {
      method: 'GET',
    });
    
    const data = await response.json();
    return data?.models || [];
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return [];
  }
}

// Hook to use Gemini models (for admins)
export function useGeminiModels() {
  return useQuery({
    queryKey: ['/api/admin/gemini/models'],
    queryFn: fetchGeminiModels,
  });
}

// Function to fetch enabled Gemini models for regular users
export async function fetchEnabledGeminiModels(): Promise<GeminiModel[]> {
  try {
    // Fetch enabled models from our API
    const response = await apiRequest('/api/gemini/models', {
      method: 'GET',
    });
    
    const data = await response.json();
    return data?.models || [];
  } catch (error) {
    console.error('Error fetching enabled Gemini models:', error);
    return [];
  }
}

// Hook to use enabled Gemini models (for regular users)
export function useEnabledGeminiModels() {
  return useQuery({
    queryKey: ['/api/gemini/models'],
    queryFn: fetchEnabledGeminiModels,
  });
}

// Function to generate content with Gemini for admins
export async function generateWithGemini(
  model: string,
  prompt: string,
  options?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  }
) {
  try {
    const response = await apiRequest('/api/admin/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
        ...options,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
}

// Function to generate AI content with a specific feature (for regular users)
export async function generateAIContent(
  feature: string,
  prompt: string,
  model?: string // Optional, will use default model if not specified
) {
  try {
    const response = await apiRequest('/api/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({
        feature,
        prompt,
        model,
      }),
    });
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Error generating AI content for feature ${feature}:`, error);
    throw error;
  }
}

// Common data used for AI generation
export const droneRuleTopics = [
  {
    id: 'airspace',
    name: 'Airspace Restrictions',
    rules: [
      'Never fly your drone in restricted airspace without authorization',
      'Maintain flight below 400 feet (120 meters) above ground level',
      'Always keep your drone within visual line of sight'
    ]
  },
  {
    id: 'safety',
    name: 'Safety Protocols',
    rules: [
      'Never fly your drone over groups of people or public events',
      'Avoid flying in adverse weather conditions',
      'Maintain a minimum distance of 30 meters from people, vehicles, and buildings'
    ]
  },
  {
    id: 'privacy',
    name: 'Privacy Guidelines',
    rules: [
      'Respect privacy and avoid recording or photographing people without consent',
      'Do not fly over private property without permission',
      'Be mindful of local privacy laws when operating your drone'
    ]
  },
  {
    id: 'registration',
    name: 'Registration Requirements',
    rules: [
      'Register your drone with local aviation authorities if required by law',
      'Display your registration number on your drone',
      'Carry proof of registration when operating your drone'
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Operations',
    rules: [
      'Obtain proper certification for commercial drone operations',
      'Maintain detailed flight logs for all commercial flights',
      'Ensure you have appropriate insurance for commercial drone use'
    ]
  }
];

// Specific AI content generation functions for different features

/**
 * Generate a weather-related comment based on current conditions
 */
export async function getWeatherComment(weatherData: {
  temperature: number;
  windSpeed: number;
  condition: string;
  precipitation: number;
}) {
  const prompt = `
    I'm planning to fly my drone today. The current weather conditions are:
    - Temperature: ${weatherData.temperature}°C
    - Wind Speed: ${weatherData.windSpeed} km/h
    - Weather Condition: ${weatherData.condition}
    - Precipitation: ${weatherData.precipitation} mm
    
    Please provide a brief comment (maximum 2 sentences) about how these conditions might affect drone flying.
    Focus on safety and optimal flight conditions. Keep it concise and helpful.
  `;
  
  try {
    return await generateAIContent('weather-comment', prompt);
  } catch (error) {
    console.error('Error generating weather comment:', error);
    throw error;
  }
}

/**
 * Generate a custom flight plan based on user inputs
 */
export async function generateCustomFlightPlan(params: {
  location: string;
  duration: number;
  droneModel?: string;
  purpose: string;
  experience: string;
}) {
  const prompt = `
    I want to create a custom flight plan with the following parameters:
    - Location: ${params.location}
    - Planned Duration: ${params.duration} minutes
    ${params.droneModel ? `- Drone Model: ${params.droneModel}` : ''}
    - Purpose: ${params.purpose}
    - Pilot Experience: ${params.experience}
    
    Please generate a detailed flight plan with:
    1. Pre-flight checklist items
    2. Suggested flight pattern or route
    3. Key points of interest to capture
    4. Safety considerations specific to the location and duration
    5. Post-flight checklist items
    
    Format the response in a structured way that's easy to read.
  `;
  
  try {
    return await generateAIContent('custom-flight-plan', prompt);
  } catch (error) {
    console.error('Error generating custom flight plan:', error);
    throw error;
  }
}

/**
 * Generate achievements and milestones based on user flight history
 */
export async function getAchievementSuggestion(userData: {
  totalFlights: number;
  flightHours: number;
  maxDistance: number;
  activeDrones: number;
  recentLocations?: string[];
}) {
  const prompt = `
    I'm a drone pilot with the following stats:
    - Total Flights: ${userData.totalFlights}
    - Flight Hours: ${userData.flightHours} hours
    - Maximum Distance Flown: ${userData.maxDistance} km
    - Active Drones: ${userData.activeDrones}
    ${userData.recentLocations ? `- Recent Flying Locations: ${userData.recentLocations.join(', ')}` : ''}
    
    Based on these statistics, suggest:
    1. One achievement I might have already unlocked
    2. One milestone I'm close to reaching
    3. A new challenge or goal I could set for myself
    
    Keep each suggestion to 1-2 sentences and make them motivating and specific to drone flying.
  `;
  
  try {
    return await generateAIContent('achievement-suggestion', prompt);
  } catch (error) {
    console.error('Error generating achievement suggestion:', error);
    throw error;
  }
}

/**
 * Generate an interesting fact about drones
 */
export async function getDroneFact(category?: string) {
  const prompt = `
    Please share an interesting fact about drones${category ? ` related to ${category}` : ''}.
    
    The fact should be engaging, educational, and concise (1-2 sentences).
    Focus on technical specifications, history, innovations, practical applications, 
    or regulations related to drones.
  `;
  
  try {
    return await generateAIContent('drone-fact', prompt);
  } catch (error) {
    console.error('Error generating drone fact:', error);
    throw error;
  }
}

/**
 * Get an explanation of a drone flying rule or regulation
 */
export async function getDroneRuleExplanation(rule: string) {
  const prompt = `
    Please explain the following drone flying rule or regulation in simple terms:
    
    "${rule}"
    
    Provide a short explanation (2-3 sentences) that covers:
    1. What the rule means for drone pilots
    2. Why this rule exists (safety, privacy, etc.)
    3. How drone pilots can ensure they comply with this rule
    
    Use plain language that a beginner drone pilot would understand.
  `;
  
  try {
    return await generateAIContent('drone-rule', prompt);
  } catch (error) {
    console.error('Error generating drone rule explanation:', error);
    throw error;
  }
}

/**
 * Get insights from a flight log
 */
export async function getFlightLogInsights(flightLog: {
  duration: number;
  distance: number;
  maxAltitude: number;
  maxSpeed: number;
  batteryUsed: number;
  location: string;
  weather?: string;
}) {
  const prompt = `
    Analyze the following drone flight log data:
    
    - Flight Duration: ${flightLog.duration} minutes
    - Distance Covered: ${flightLog.distance} km
    - Maximum Altitude: ${flightLog.maxAltitude} meters
    - Maximum Speed: ${flightLog.maxSpeed} km/h
    - Battery Used: ${flightLog.batteryUsed}%
    - Location: ${flightLog.location}
    ${flightLog.weather ? `- Weather Conditions: ${flightLog.weather}` : ''}
    
    Please provide 3 key insights about this flight, focusing on:
    1. Performance metrics (speed, efficiency)
    2. Flight patterns or technique suggestions
    3. Safety observations or recommendations
    
    Keep insights concise (1-2 sentences each) and actionable for the drone pilot.
  `;
  
  try {
    return await generateAIContent('flight-log-insights', prompt);
  } catch (error) {
    console.error('Error generating flight log insights:', error);
    throw error;
  }
}