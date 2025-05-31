// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/components/SuperadminAuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface SuperadminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, passwordHash: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const SuperadminAuthContext = createContext<SuperadminAuthContextType | undefined>(undefined);

export const useSuperadminAuth = () => {
  const context = useContext(SuperadminAuthContext);
  if (context === undefined) {
    throw new Error('useSuperadminAuth must be used within a SuperadminAuthProvider');
  }
  return context;
};

export const SuperadminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to check authentication status (by attempting to fetch a protected route or API)
  const checkAuthStatus = useCallback(async () => {
    try {
      // Attempt to access a protected API route or just check the token's presence
      // For simplicity, we'll check if the token is present via a simple API call
      const response = await fetch('/api/superadmin-status'); // Create this simple API route later
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking superadmin auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/superadmin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        toast.success('Superadmin login successful!');
        router.push('/superadmin');
        return { success: true };
      } else {
        toast.error(data.message || 'Invalid credentials.');
        setIsAuthenticated(false);
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      console.error('Login request failed:', error);
      toast.error('Login failed: ' + error.message || 'Network error.');
      setIsAuthenticated(false);
      return { success: false, message: error.message || 'Network error.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/superadmin-logout', { method: 'POST' }); // Create this API route for logout
      setIsAuthenticated(false);
      toast.info('Superadmin logged out.');
      router.push('/superadmin/login');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed: ' + error.message);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 animate-pulse">Checking superadmin authentication...</p>
      </div>
    );
  }

  // If not authenticated and not on the login page, redirect to login
  if (!isAuthenticated && pathname !== '/superadmin/login') {
    router.replace('/superadmin/login');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Redirecting to superadmin login...</p>
      </div>
    );
  }

  return (
    <SuperadminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </SuperadminAuthContext.Provider>
  );
};