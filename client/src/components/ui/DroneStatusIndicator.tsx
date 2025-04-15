import { formatDroneStatus } from "@/lib/useDrones";

interface DroneStatusIndicatorProps {
  status: string;
  className?: string;
}

export default function DroneStatusIndicator({ 
  status, 
  className = ''
}: DroneStatusIndicatorProps) {
  const statusInfo = formatDroneStatus(status);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${className}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color} mr-2`}></span>
      {statusInfo.label}
    </span>
  );
}
