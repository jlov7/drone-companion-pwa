import { TrendingUpIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon, change }: StatCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
          {icon}
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-secondary-800">{value}</p>
            {change && (
              <p className={`ml-2 text-sm font-medium ${change.isPositive ? 'text-success' : 'text-danger'}`}>
                <TrendingUpIcon className={`h-4 w-4 inline ${!change.isPositive && 'rotate-180'}`} />
                {change.value}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
