import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import FlightLogs from "@/pages/FlightLogs";
import MyDrones from "@/pages/MyDrones";
import FlightPlanning from "@/pages/FlightPlanning";
import Weather from "@/pages/Weather";
import BatteryManagement from "@/pages/BatteryManagement";
import Analytics from "@/pages/Analytics";
import Learn from "@/pages/Learn";
import Login from "@/pages/Login";
import Account from "@/pages/Account";
import AdminDashboard from "@/pages/AdminDashboard";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RouteGuard from "@/components/auth/RouteGuard";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { useMemo, useState, useEffect } from "react";

// Public routes (no authentication required)
function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="*">
        <AuthenticatedRouter />
      </Route>
    </Switch>
  );
}

// Protected routes (require authentication)
function AuthenticatedRouter() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Check if current route is a public route
  const isPublicRoute = location === '/login';
  
  // If on public route and authenticated, redirect to dashboard
  useEffect(() => {
    if (isPublicRoute && user) {
      // Navigate to dashboard if already logged in
      window.location.href = '/dashboard';
    }
  }, [isPublicRoute, user]);

  return (
    <RouteGuard>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/flights" component={FlightLogs} />
        <Route path="/drones" component={MyDrones} />
        <Route path="/planning" component={FlightPlanning} />
        <Route path="/weather" component={Weather} />
        <Route path="/battery" component={BatteryManagement} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/learn" component={Learn} />
        <Route path="/account" component={Account} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </RouteGuard>
  );
}

// Main application layout with context
function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  
  // Update online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Last sync time (for display purposes)
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Memoize the app context to avoid unnecessary re-renders
  const appContext = useMemo(() => ({
    userId: user?.id,
    online,
    lastSync,
    syncData: () => {
      // Sync data with the server
      setLastSync(new Date());
    }
  }), [user, online, lastSync]);

  // Full-page layout for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicRouter />
      </div>
    );
  }

  // Application layout for authenticated users
  return (
    <div className="min-h-screen flex flex-col">
      <Header {...appContext} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar lastSync={lastSync} online={online} />
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <PublicRouter />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
