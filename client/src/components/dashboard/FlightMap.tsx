import { useEffect, useState } from "react";
import { useMap, useMapInfo } from "@/lib/useMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinIcon, PlusIcon, LocateIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FlightMapProps {
  userId: number;
  onPlanFlight: () => void;
}

export default function FlightMap({ userId, onPlanFlight }: FlightMapProps) {
  const [defaultLocation] = useState<[number, number]>([37.7749, -122.4194]); // San Francisco
  const mapElementId = "flight-map";
  
  const { 
    mapLoaded, 
    mapInstance, 
    currentLocation, 
    isLocating, 
    locationError, 
    getCurrentLocation, 
    mapContainer 
  } = useMap(mapElementId, {
    center: defaultLocation,
    zoom: 12
  });
  
  const { 
    data: mapInfo, 
    isLoading: isLoadingMapInfo 
  } = useMapInfo(currentLocation || defaultLocation);
  
  // Draw sample flight path when map is loaded (for demonstration)
  useEffect(() => {
    if (mapLoaded && mapInstance) {
      // Example flight path - this would come from API in a real app
      const samplePath: [number, number][] = [
        [37.7749, -122.4194], // San Francisco
        [37.7833, -122.4167],
        [37.7923, -122.4144],
        [37.7984, -122.4102],
        [37.8028, -122.4058],
        [37.8073, -122.3980]
      ];
      
      // Add the flight path to the map
      if (mapInstance.addPolyline) {
        mapInstance.addPolyline(samplePath, { color: 'blue', weight: 3 });
      } else if (window.L) {
        window.L.polyline(samplePath, { color: 'blue', weight: 3 }).addTo(mapInstance);
      }
    }
  }, [mapLoaded, mapInstance]);

  return (
    <div className="relative">
      <div ref={mapContainer} id={mapElementId} className="map-container h-80 w-full">
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p className="text-lg font-medium mb-1">Loading Map...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button 
          size="sm" 
          className="bg-white text-gray-700 hover:bg-gray-100 shadow"
          onClick={getCurrentLocation}
          disabled={isLocating}
        >
          <LocateIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-danger-100 text-danger-800 p-2 rounded text-sm">
          {locationError}
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {isLoadingMapInfo ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div>
              <div className="text-xs font-medium text-gray-500">No-fly zones nearby</div>
              <div className="text-lg font-semibold text-secondary-800">
                {mapInfo?.noFlyZones || 0}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">ATC Requirements</div>
              <div className="text-lg font-semibold text-secondary-800">
                {mapInfo?.atcRequirements || 'None'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">Active Flights Nearby</div>
              <div className="text-lg font-semibold text-secondary-800">
                {mapInfo?.nearbyFlights || 0}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">Saved Locations</div>
              <div className="text-lg font-semibold text-secondary-800">
                {mapInfo?.savedLocations || 0}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="absolute top-4 left-4">
        <Button 
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-primary-300 focus:shadow-outline-primary active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
          onClick={onPlanFlight}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Plan Flight
        </Button>
      </div>
    </div>
  );
}
