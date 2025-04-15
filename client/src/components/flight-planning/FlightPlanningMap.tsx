import { useState, useEffect, useRef } from "react";
import { useMap } from "@/lib/useMap";
import { Button } from "@/components/ui/button";
import {
  MapPinIcon,
  TargetIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  MapIcon,
  LayersIcon,
} from "lucide-react";

interface FlightPlanningMapProps {
  center: [number, number];
  waypoints: [number, number][];
  onWaypointsChange: (waypoints: [number, number][]) => void;
  onLocationChange?: (location: string) => void;
  readOnly?: boolean;
  noFlyZones?: any[];
  showControls?: boolean;
  mapHeight?: string;
}

export default function FlightPlanningMap({
  center = [37.7749, -122.4194], // Default to SF
  waypoints = [],
  onWaypointsChange,
  onLocationChange,
  readOnly = false,
  noFlyZones = [],
  showControls = true,
  mapHeight = "100%",
}: FlightPlanningMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'terrain'>('satellite');
  const [isPathEditing, setIsPathEditing] = useState(false);
  
  // Initialize the map using our custom hook
  const { map, markers, addMarker, updateMarker, removeMarker, clearMarkers, addPolyline, updatePolyline, getLocationName } = useMap("flight-planning-map", {
    center,
    zoom: 14,
  });
  
  // Update markers when waypoints change
  useEffect(() => {
    if (!map) return;
    
    // Clear any existing markers
    clearMarkers();
    
    // Add markers for each waypoint
    waypoints.forEach((waypoint, index) => {
      addMarker(waypoint, {
        draggable: !readOnly,
        title: `Waypoint ${index + 1}`,
        onDragEnd: (position) => {
          const newWaypoints = [...waypoints];
          newWaypoints[index] = [position[0], position[1]];
          onWaypointsChange(newWaypoints);
        },
        onClick: () => {
          setActiveWaypoint(index);
        }
      });
    });
    
    // Add polyline to connect waypoints
    if (waypoints.length > 1) {
      addPolyline(waypoints, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8
      });
    }
    
    // Add no-fly zones if provided
    noFlyZones?.forEach(zone => {
      if (zone.polygon && zone.polygon.length > 0) {
        addPolyline(zone.polygon, {
          color: zone.type === 'restricted' ? '#ef4444' : '#f59e0b',
          weight: 2,
          opacity: 0.7,
          fill: true,
          fillColor: zone.type === 'restricted' ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.2
        });
      }
    });
    
  }, [map, waypoints, noFlyZones, readOnly]);
  
  // Handle map click to add waypoints
  useEffect(() => {
    if (!map || readOnly) return;
    
    const handleMapClick = async (e: any) => {
      const position: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      if (isPathEditing) {
        // Add a new waypoint
        const newWaypoints = [...waypoints, position];
        onWaypointsChange(newWaypoints);
        
        // If this is the first waypoint, update the location name
        if (newWaypoints.length === 1 && onLocationChange) {
          try {
            const locationName = await getLocationName(position);
            if (locationName) {
              onLocationChange(locationName);
            }
          } catch (error) {
            console.error("Error getting location name:", error);
          }
        }
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, waypoints, isPathEditing, readOnly]);
  
  // Handle adding a single waypoint
  const handleAddWaypoint = () => {
    if (!map) return;
    
    // Get the center of the map view
    const center = map.getCenter();
    const position: [number, number] = [center.lat, center.lng];
    
    // Add a new waypoint
    const newWaypoints = [...waypoints, position];
    onWaypointsChange(newWaypoints);
  };
  
  // Handle removing a waypoint
  const handleRemoveWaypoint = (index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    onWaypointsChange(newWaypoints);
    setActiveWaypoint(null);
  };
  
  // Handle removing the last waypoint
  const handleRemoveLastWaypoint = () => {
    if (waypoints.length === 0) return;
    
    const newWaypoints = [...waypoints];
    newWaypoints.pop();
    onWaypointsChange(newWaypoints);
  };
  
  // Handle clearing all waypoints
  const handleClearWaypoints = () => {
    onWaypointsChange([]);
    setActiveWaypoint(null);
  };
  
  // Toggle path editing mode
  const togglePathEditing = () => {
    setIsPathEditing(!isPathEditing);
  };
  
  // Change map type
  const toggleMapType = () => {
    setMapType(mapType === 'satellite' ? 'terrain' : 'satellite');
    
    // In a real implementation, you would update the map tiles here
    // This is just a placeholder since we don't have actual map integration
    console.log(`Map type changed to ${mapType === 'satellite' ? 'terrain' : 'satellite'}`);
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    if (!map) return;
    map.setZoom(map.getZoom() + 1);
  };
  
  const handleZoomOut = () => {
    if (!map) return;
    map.setZoom(map.getZoom() - 1);
  };
  
  // Focus on the active waypoint
  const focusOnWaypoint = (index: number) => {
    if (!map || index >= waypoints.length) return;
    
    const waypoint = waypoints[index];
    map.setView(waypoint, 16);
    setActiveWaypoint(index);
  };
  
  // Center map on the current path
  const centerOnPath = () => {
    if (!map || waypoints.length === 0) return;
    
    if (waypoints.length === 1) {
      map.setView(waypoints[0], 15);
      return;
    }
    
    // Find bounds for all waypoints
    const bounds = waypoints.reduce((bounds, point) => {
      return bounds.extend(point);
    }, new L.LatLngBounds(waypoints[0], waypoints[0]));
    
    map.fitBounds(bounds, { padding: [50, 50] });
  };
  
  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div 
        id="flight-planning-map" 
        ref={mapContainerRef} 
        className="h-full w-full rounded-md overflow-hidden"
        style={{ height: mapHeight }}
      >
        {/* Placeholder for when map doesn't load - in a real implementation this would be handled by the mapping library */}
        <div className="flex items-center justify-center h-full w-full bg-gray-100">
          <div className="text-center">
            <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              Map would display here in a production environment. For this demo, imagine an interactive map where you can place waypoints and plan drone flights.
            </p>
          </div>
        </div>
      </div>
      
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md"
            onClick={toggleMapType}
          >
            <LayersIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md"
            onClick={handleZoomIn}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md"
            onClick={handleZoomOut}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md"
            onClick={centerOnPath}
          >
            <TargetIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Path Editing Controls */}
      {!readOnly && showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <Button
            variant={isPathEditing ? "default" : "secondary"}
            size="sm"
            className={isPathEditing ? "" : "bg-white shadow-md"}
            onClick={togglePathEditing}
          >
            {isPathEditing ? "Finish Drawing" : "Draw Path"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white shadow-md"
            onClick={handleAddWaypoint}
          >
            Add Waypoint
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white shadow-md"
            onClick={handleRemoveLastWaypoint}
            disabled={waypoints.length === 0}
          >
            Remove Last
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white shadow-md"
            onClick={handleClearWaypoints}
            disabled={waypoints.length === 0}
          >
            Clear All
          </Button>
        </div>
      )}
      
      {/* Waypoints List */}
      {waypoints.length > 0 && showControls && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md max-h-40 overflow-y-auto">
          <div className="text-xs font-medium text-gray-500 mb-1">Waypoints</div>
          {waypoints.map((waypoint, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between py-1 px-2 text-xs rounded ${activeWaypoint === index ? 'bg-primary-100' : 'hover:bg-gray-100'}`}
              onClick={() => focusOnWaypoint(index)}
            >
              <div>
                <span className="font-medium">#{index + 1}</span>
                <span className="text-gray-600 ml-1">
                  {waypoint[0].toFixed(4)}, {waypoint[1].toFixed(4)}
                </span>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveWaypoint(index);
                  }}
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}