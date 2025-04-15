import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface MapOptions {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  mapId?: string;
}

export interface NoFlyZone {
  id: string;
  name: string;
  type: 'restricted' | 'airport' | 'temporary' | 'custom';
  polygon: [number, number][]; // Array of [latitude, longitude] pairs
}

// Default map center (San Francisco)
const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export function useMap(elementId: string, options: Partial<MapOptions> = {}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [noFlyZones, setNoFlyZones] = useState<NoFlyZone[]>([]);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  
  // Default options
  const mapOptions: MapOptions = {
    center: options.center || DEFAULT_CENTER,
    zoom: options.zoom || 12,
    mapId: options.mapId || 'map'
  };
  
  // Load Leaflet map
  useEffect(() => {
    // Don't load if no element ID is provided
    if (!elementId) return;
    
    // Don't re-initialize if map is already loaded
    if (mapLoaded && mapInstance) return;
    
    // Check if Leaflet is already loaded
    if (typeof window.L === 'undefined') {
      // Load Leaflet CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      linkElement.crossOrigin = '';
      document.head.appendChild(linkElement);
      
      // Load Leaflet JS
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      scriptElement.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      scriptElement.crossOrigin = '';
      
      scriptElement.onload = () => {
        initializeMap();
      };
      
      document.head.appendChild(scriptElement);
    } else {
      initializeMap();
    }
    
    function initializeMap() {
      const container = document.getElementById(elementId);
      
      if (!container) {
        console.error(`Element with ID "${elementId}" not found`);
        return;
      }
      
      // Initialize the map
      const map = window.L.map(elementId, {
        center: mapOptions.center,
        zoom: mapOptions.zoom
      });
      
      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      setMapInstance(map);
      setMapLoaded(true);
    }
    
    return () => {
      // Clean up map instance when component unmounts
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
        setMapLoaded(false);
      }
    };
  }, [elementId, mapOptions.center, mapOptions.zoom]);
  
  // Get user's current location
  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setCurrentLocation(location);
        
        if (mapInstance) {
          mapInstance.setView(location, mapOptions.zoom);
          
          // Add marker for current location
          window.L.marker(location).addTo(mapInstance)
            .bindPopup('Your current location')
            .openPopup();
        }
        
        setIsLocating(false);
      },
      (error) => {
        setLocationError(`Failed to get location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };
  
  // Mock data for no-fly zones
  useEffect(() => {
    if (mapLoaded && mapInstance) {
      // Sample no-fly zones (in a real app, these would come from an API)
      const mockNoFlyZones: NoFlyZone[] = [
        {
          id: '1',
          name: 'San Francisco International Airport',
          type: 'airport',
          polygon: [
            [37.6213, -122.3790],
            [37.6213, -122.3589],
            [37.6104, -122.3589],
            [37.6104, -122.3790]
          ]
        },
        {
          id: '2',
          name: 'Golden Gate Park Restricted Area',
          type: 'restricted',
          polygon: [
            [37.7694, -122.4862],
            [37.7694, -122.4559],
            [37.7659, -122.4559],
            [37.7659, -122.4862]
          ]
        }
      ];
      
      setNoFlyZones(mockNoFlyZones);
      
      // Add no-fly zones to map
      mockNoFlyZones.forEach(zone => {
        const color = zone.type === 'airport' ? 'red' : 
                      zone.type === 'restricted' ? 'orange' : 
                      zone.type === 'temporary' ? 'yellow' : 'blue';
        
        window.L.polygon(zone.polygon, {
          color,
          fillColor: color,
          fillOpacity: 0.2
        }).addTo(mapInstance).bindPopup(`No-fly zone: ${zone.name}`);
      });
    }
  }, [mapLoaded, mapInstance]);
  
  // Draw flight path on the map
  const drawFlightPath = (path: [number, number][]) => {
    if (!mapLoaded || !mapInstance) return;
    
    // Create polyline for flight path
    const polyline = window.L.polyline(path, { color: 'blue', weight: 3 }).addTo(mapInstance);
    
    // Add start and end markers
    if (path.length > 0) {
      const startPoint = path[0];
      const endPoint = path[path.length - 1];
      
      window.L.marker(startPoint, {
        icon: window.L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(mapInstance).bindPopup('Start point');
      
      window.L.marker(endPoint, {
        icon: window.L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(mapInstance).bindPopup('End point');
    }
    
    // Fit map to show the entire path
    mapInstance.fitBounds(polyline.getBounds());
  };
  
  // Clear map overlays (markers, paths, etc.)
  const clearMap = () => {
    if (!mapLoaded || !mapInstance) return;
    
    // Remove all layers except tile layers
    mapInstance.eachLayer((layer: any) => {
      if (!(layer instanceof window.L.TileLayer)) {
        mapInstance.removeLayer(layer);
      }
    });
    
    // Re-add no-fly zones
    noFlyZones.forEach(zone => {
      const color = zone.type === 'airport' ? 'red' : 
                    zone.type === 'restricted' ? 'orange' : 
                    zone.type === 'temporary' ? 'yellow' : 'blue';
      
      window.L.polygon(zone.polygon, {
        color,
        fillColor: color,
        fillOpacity: 0.2
      }).addTo(mapInstance).bindPopup(`No-fly zone: ${zone.name}`);
    });
  };
  
  return {
    mapLoaded,
    mapInstance,
    noFlyZones,
    currentLocation,
    isLocating,
    locationError,
    getCurrentLocation,
    drawFlightPath,
    clearMap,
    mapContainer
  };
}

// Mock query for nearby drone-related information
export function useMapInfo(location: [number, number] | null) {
  return useQuery({
    queryKey: ['mapInfo', location?.join(',')],
    queryFn: async () => {
      // In a real app, this would fetch data from an API
      return {
        noFlyZones: 3,
        atcRequirements: 'None',
        nearbyFlights: 0,
        savedLocations: 8
      };
    },
    enabled: !!location,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
