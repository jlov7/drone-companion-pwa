import { Link, useLocation } from "wouter";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import {
  HomeIcon,
  BarChartIcon,
  MapIcon,
  BatteryFullIcon,
  CloudIcon,
  BoxIcon,
  LineChartIcon,
  GraduationCap,
  ShieldIcon
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

interface SidebarProps {
  lastSync: Date | null;
  online: boolean;
}

export default function Sidebar({ lastSync, online }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const formatLastSync = () => {
    if (!lastSync) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: HomeIcon
    },
    {
      path: '/flights',
      label: 'Flight Logs',
      icon: BarChartIcon
    },
    {
      path: '/drones',
      label: 'My Drones',
      icon: BoxIcon
    },
    {
      path: '/planning',
      label: 'Flight Planning',
      icon: MapIcon
    },
    {
      path: '/weather',
      label: 'Weather',
      icon: CloudIcon
    },
    {
      path: '/battery',
      label: 'Battery Management',
      icon: BatteryFullIcon
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: LineChartIcon
    },
    {
      path: '/learn',
      label: 'Learn',
      icon: GraduationCap
    }
  ];
  
  return (
    <aside className="w-20 md:w-64 bg-primary text-white transition-all duration-300 ease-in-out">
      <div className="h-full flex flex-col">
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`group flex items-center px-2 py-2 rounded-md ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-white hover:bg-blue-700 hover:text-white'
              }`}
            >
              <item.icon className="h-6 w-6 mr-3 text-white" />
              <span className="hidden md:inline text-white font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* Admin Section - Only shown to admin users */}
          {user?.role === 'admin' && (
            <Link 
              href="/admin"
              className={`group flex items-center px-2 py-2 rounded-md mt-6 ${
                isActive('/admin') 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-white hover:bg-blue-700 hover:text-white'
              }`}
            >
              <ShieldIcon className="h-6 w-6 mr-3 text-white" />
              <span className="hidden md:inline text-white font-medium">Admin Dashboard</span>
            </Link>
          )}
        </nav>
        <div className="p-4 hidden md:block">
          <div className="bg-blue-700 rounded-lg p-3">
            <h3 className="text-sm font-medium text-white">Connection Status</h3>
            <ConnectionStatus online={online} />
            <div className="mt-2 text-xs text-white font-medium">Last sync: {formatLastSync()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
