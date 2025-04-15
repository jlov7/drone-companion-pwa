import { formatRelativeTime } from "@/lib/useFlights";
import DroneStatusIndicator from "@/components/ui/DroneStatusIndicator";
import BatteryGauge from "@/components/ui/BatteryGauge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drone } from "@shared/schema";
import { formatDroneStorage } from "@/lib/useDrones";

interface DroneStatusProps {
  drone: Drone;
  onViewDetails: (droneId: number) => void;
}

export default function DroneStatus({ drone, onViewDetails }: DroneStatusProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <DroneStatusIndicator status={drone.status} />
          <span className="ml-3 text-sm font-medium text-gray-500">
            Updated {formatRelativeTime(drone.lastSync)}
          </span>
        </div>
        <div>
          <Button 
            variant="link" 
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            onClick={() => onViewDetails(drone.id)}
          >
            Flight Details
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap md:flex-nowrap">
        <div className="w-full md:w-1/2 lg:w-2/5 mr-4">
          <h3 className="font-medium text-secondary-800">{drone.name}</h3>
          <div className="text-sm text-gray-500 mb-1">S/N: {drone.serialNumber}</div>
          <div className="flex items-center mt-2">
            <span className="text-sm font-medium text-gray-600 mr-2">Battery:</span>
            <div className="flex-1">
              <BatteryGauge percentage={drone.batteryPercent || 0} />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 lg:w-3/5 mt-4 md:mt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Last Flight</div>
              <div className="text-sm font-medium">
                {drone.lastFlightId ? formatRelativeTime(drone.lastSync) : 'No flights yet'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Flight Time</div>
              <div className="text-sm font-medium">{drone.flightTime?.toFixed(1) || 0} hours</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Firmware</div>
              <div className="text-sm font-medium">{drone.firmware || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Storage</div>
              <div className="text-sm font-medium">
                {drone.storageUsed && drone.storageTotal 
                  ? formatDroneStorage(drone.storageUsed, drone.storageTotal)
                  : 'No data'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
