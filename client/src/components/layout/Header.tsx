import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, BellIcon, User } from "lucide-react";
import { syncOfflineData } from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";

interface HeaderProps {
  userId?: number;
  online: boolean;
  lastSync: Date | null;
  syncData: () => void;
}

export default function Header({ userId, online, lastSync, syncData }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  
  const handleSync = async () => {
    setSyncing(true);
    
    try {
      if (online) {
        await syncOfflineData();
        syncData(); // Update last sync time
        
        toast({
          title: "Sync Successful",
          description: "Your data has been synchronized with the cloud.",
          variant: "default",
        });
      } else {
        toast({
          title: "Offline Mode",
          description: "Cannot sync while offline. Your changes will be saved locally and synchronized when you're back online.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Error synchronizing data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-semibold text-secondary-700">DroneLogger Pro</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="bg-primary text-white hover:bg-primary-600 focus:ring-primary-500"
            >
              {syncing ? (
                <RotateCcw className="h-5 w-5 inline-block mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-5 w-5 inline-block mr-1" />
              )}
              Sync
            </Button>
            <div className="relative">
              <button className="bg-gray-100 p-2 rounded-full text-secondary-500 hover:text-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <BellIcon className="h-6 w-6" />
              </button>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-accent ring-2 ring-white"></span>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center">
                <button 
                  className="text-sm text-gray-700 hover:text-primary mr-3"
                  onClick={() => setLocation('/account')}
                >
                  My Account
                </button>
                <Avatar onClick={() => setLocation('/account')}>
                  <AvatarImage src={user?.profileImage} alt={user?.name || user?.username} />
                  <AvatarFallback>
                    {user?.name 
                      ? `${user.name.split(' ')[0][0]}${user.name.split(' ').length > 1 ? user.name.split(' ')[1][0] : ''}`
                      : user?.username?.[0].toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setLocation('/login')}
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
