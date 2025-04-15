import React from "react";

interface WeatherGaugeProps {
  value: number;
  maxValue: number;
  color: string;
}

export default function WeatherGauge({ value, maxValue, color }: WeatherGaugeProps) {
  // Calculate percentage
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div className="relative h-2 bg-gray-200 rounded-full">
      <div 
        className={`absolute top-0 left-0 h-2 rounded-full ${color}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}