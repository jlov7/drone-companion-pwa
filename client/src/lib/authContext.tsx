import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: string | null;
  isEmailVerified: boolean | null;
  createdAt: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  register: (username: string, email: string, password: string, name?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Query for the current user
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, but this is expected
            return null;
          }
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching authenticated user:', error);
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsLoading(userLoading);
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
    if (userError) {
      setError(userError as Error);
    }
  }, [userData, userLoading, userError]);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const userData = await response.json();
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation('/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError(error as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string, 
    email: string, 
    password: string, 
    name?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You can now log in.',
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}