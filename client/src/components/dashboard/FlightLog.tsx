import { formatFlightDuration, formatRelativeTime } from "@/lib/useFlights";
import { Card } from "@/components/ui/card";
import { FlightLog as FlightLogType } from "@shared/schema";
import { ClockIcon, MapPinIcon, ChevronRightIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface FlightLogProps {
  flight: FlightLogType;
  onViewDetails: (flightId: number) => void;
}

export default function FlightLog({ flight, onViewDetails }: FlightLogProps) {
  // Initial letter of the drone name for the avatar fallback
  const droneInitial = flight.droneId.toString()[0] || 'D';

  return (
    <div className="p-5 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-secondary-800">{flight.location || 'Unknown location'}</h3>
        <span className="text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
          {formatRelativeTime(flight.startTime)}
        </span>
      </div>
      <div className="flex items-center text-sm text-gray-500 mb-3">
        <ClockIcon className="h-4 w-4 mr-1" />
        <span>{flight.duration ? formatFlightDuration(flight.duration) : 'N/A'}</span>
        <span className="mx-2">•</span>
        <MapPinIcon className="h-4 w-4 mr-1" />
        <span>{flight.distance ? `${flight.distance.toFixed(1)} km` : 'N/A'}</span>
      </div>
      <div className="flex items-center">
        <Avatar className="h-10 w-10 rounded-md">
          <AvatarFallback className="bg-primary-100 text-primary-800">
            {droneInitial}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <div className="text-sm font-medium text-secondary-700">Drone #{flight.droneId}</div>
          <div className="text-xs text-gray-500">
            {flight.notes ? flight.notes.substring(0, 30) + (flight.notes.length > 30 ? '...' : '') : 'No notes'}
          </div>
        </div>
        <button 
          className="ml-auto text-primary-600 hover:text-primary-800"
          onClick={() => onViewDetails(flight.id)}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
