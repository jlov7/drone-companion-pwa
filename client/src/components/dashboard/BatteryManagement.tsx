import { useBatteries, formatBatteryStatus, getBatteryTips } from "@/lib/useBatteries";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Battery as BatteryType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon } from "lucide-react";

interface BatteryManagementProps {
  userId: number;
  onViewAll: () => void;
}

export default function BatteryManagement({ userId, onViewAll }: BatteryManagementProps) {
  const { data: batteries, isLoading, error } = useBatteries(userId);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j}>
                    <div className="flex justify-between text-sm mb-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error loading batteries",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive",
    });
  }

  const displayBatteries = batteries?.slice(0, 2) || [];
  const batteryTips = getBatteryTips(batteries || []);

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {displayBatteries.length === 0 ? (
          <div className="col-span-2 p-4 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No batteries found. Add batteries to monitor their health.</p>
          </div>
        ) : (
          displayBatteries.map((battery) => (
            <BatteryCard key={battery.id} battery={battery} />
          ))
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-secondary-800 mb-2">Battery Tips</h3>
        {batteryTips.length === 0 ? (
          <p className="text-sm text-gray-600">No battery tips available.</p>
        ) : (
          <ul className="text-sm text-gray-600 space-y-2">
            {batteryTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <InfoIcon className="h-5 w-5 text-accent-500 mr-2 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface BatteryCardProps {
  battery: BatteryType;
}

function BatteryCard({ battery }: BatteryCardProps) {
  const statusInfo = formatBatteryStatus(battery.status || 'unknown');
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-secondary-800">{battery.name}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Charge Cycles</span>
          <span className="font-medium text-secondary-700">
            {battery.chargeCycles} / {battery.maxChargeCycles}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-success h-2 rounded-full" 
            style={{ width: `${Math.min(100, (battery.chargeCycles || 0) / (battery.maxChargeCycles || 1) * 100)}%` }}
          ></div>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Health</span>
          <span className="font-medium text-secondary-700">{battery.health}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              battery.health >= 80 ? 'bg-success' : 
              battery.health >= 60 ? 'bg-accent' : 
              battery.health >= 40 ? 'bg-warning' : 'bg-danger'
            }`} 
            style={{ width: `${battery.health}%` }}
          ></div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <span className="block">
          Last used: <span className="font-medium text-secondary-700">
            {battery.lastUsed ? new Date(battery.lastUsed).toLocaleDateString() : 'Never'}
          </span>
        </span>
        <span className="block">
          Estimated flight time: <span className="font-medium text-secondary-700">
            {battery.estimatedFlightTime} minutes
          </span>
        </span>
      </div>
    </div>
  );
}
