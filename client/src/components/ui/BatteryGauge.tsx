interface BatteryGaugeProps {
  percentage: number;
  showText?: boolean;
  className?: string;
}

export default function BatteryGauge({ 
  percentage, 
  showText = true, 
  className = '' 
}: BatteryGaugeProps) {
  const getColor = () => {
    if (percentage > 75) return 'bg-success';
    if (percentage > 40) return 'bg-accent';
    if (percentage > 20) return 'bg-warning';
    return 'bg-danger';
  };
  
  return (
    <div className={`relative h-6 bg-gray-200 rounded-md overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-500 ease-out ${getColor()}`}
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
      {showText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white mix-blend-difference">
          {percentage}%
        </div>
      )}
    </div>
  );
}
