import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated after loading completes
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        setLocation('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        // Redirect to dashboard if user doesn't have required role
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, setLocation]);

  // Show nothing while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Render children only if authenticated and has required role
  return (isAuthenticated && (!requiredRole || user?.role === requiredRole)) ? (
    <>{children}</>
  ) : null;
}