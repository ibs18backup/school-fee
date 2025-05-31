// sfms/components/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/lib/database.types';

type SchoolAdminInfo = {
  schoolId: string | null;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // For initial auth check
  isSchoolInfoLoading: boolean; // Separate loading for school info
  logout: () => Promise<void>;
  schoolId: string | null;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [schoolAdminInfo, setSchoolAdminInfo] = useState<SchoolAdminInfo>({ schoolId: null, isAdmin: false });
  const [isLoading, setIsLoading] = useState(true); // For the main auth user/session
  const [isSchoolInfoLoading, setIsSchoolInfoLoading] = useState(false); // Separate loading for school info

  console.log('AuthContext_V6: Render. isLoading:', isLoading, 'isSchoolInfoLoading:', isSchoolInfoLoading);

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext_V6_useEffect: Hook starts.');
    setIsLoading(true); // Set loading true for initial auth check

    if (!supabase || !supabase.auth) {
        console.error('AuthContext_V6_useEffect: Supabase client or supabase.auth is not available!');
        if (isMounted) setIsLoading(false);
        return;
    }

    const fetchSchoolAdminInfo = async (userId: string) => {
      if (!isMounted) return;
      console.log(`AuthContext_V6_fetchSchoolAdminInfo: START - User: ${userId}`);
      setIsSchoolInfoLoading(true); // Set loading for school info
      try {
        const { data, error, status } = await supabase
          .from('school_administrators')
          .select('school_id, role')
          .eq('user_id', userId)
          .single();

        if (!isMounted) return; // Check again after await

        if (error && status !== 406) {
          console.warn('AuthContext_V6_fetchSchoolAdminInfo: Error fetching school_administrators:', error.message);
          setSchoolAdminInfo({ schoolId: null, isAdmin: false });
          toast.error("Failed to load school information for your account. Please try re-logging in.");
        } else if (data) {
          console.log('AuthContext_V6_fetchSchoolAdminInfo: Data fetched from school_administrators:', data);
          setSchoolAdminInfo({ schoolId: data.school_id, isAdmin: data.role === 'admin' });

          // --- NEW DIAGNOSTIC STEP IN AUTHCONTEXT ---
          // Immediately try to fetch the school name using the retrieved school_id within AuthContext itself
          if (data.school_id) {
            console.log(`AuthContext_V6_fetchSchoolAdminInfo: Attempting to confirm school name for ID: "${data.school_id}" from 'schools' table.`);
            const { data: schoolNameData, error: schoolNameError } = await supabase
              .from('schools')
              .select('name')
              .eq('id', data.school_id)
              .maybeSingle(); // Use maybeSingle() here

            if (schoolNameError) {
              console.error(`AuthContext_V6_fetchSchoolAdminInfo: Error confirming school name for ID "${data.school_id}":`, schoolNameError.message);
              toast.error("Internal Auth Error: Could not confirm school details.");
            } else if (schoolNameData) {
              console.log(`AuthContext_V6_fetchSchoolAdminInfo: Confirmed school name: "${schoolNameData.name}" for ID: "${data.school_id}" from 'schools' table.`);
            } else {
              console.warn(`AuthContext_V6_fetchSchoolAdminInfo: School ID "${data.school_id}" from school_administrators does NOT have a matching record in 'schools' table (maybeSingle returned null). This indicates a data inconsistency.`);
              toast.error("Data inconsistency: Linked school ID not found in schools table.");
            }
          } else {
            console.log('AuthContext_V6_fetchSchoolAdminInfo: school_id is null, skipping school name confirmation.');
          }
          // --- END NEW DIAGNOSTIC STEP ---

        } else {
          console.log('AuthContext_V6_fetchSchoolAdminInfo: No data found in school_administrators.');
          setSchoolAdminInfo({ schoolId: null, isAdmin: false });
        }
      } catch (e: any) {
        if (!isMounted) return;
        console.error("AuthContext_V6_fetchSchoolAdminInfo: EXCEPTION during school admin info fetch:", e.message);
        setSchoolAdminInfo({ schoolId: null, isAdmin: false });
        toast.error(`An unexpected error occurred while loading school info: ${e.message}`);
      } finally {
        if (isMounted) setIsSchoolInfoLoading(false); // Always set school info loading to false
        console.log('AuthContext_V6_fetchSchoolAdminInfo: FINISHED.');
      }
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log(`AuthContext_V6_onAuthStateChange: Event: ${_event}, User: ${currentSession?.user?.id}`);
        if (!isMounted) return;
        
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchSchoolAdminInfo(currentUser.id);
        } else {
          setSchoolAdminInfo({ schoolId: null, isAdmin: false });
        }
        
        console.log('AuthContext_V6_onAuthStateChange: Setting main isLoading to false.');
        setIsLoading(false);
      }
    );

    return () => {
      console.log("AuthContext_V6_useEffect: Cleanup.");
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    setIsSchoolInfoLoading(false); // Reset school info loading
    setSchoolAdminInfo({ schoolId: null, isAdmin: false }); // Clear school info
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
      setIsLoading(false);
    } else {
      toast.success("Logged out successfully.");
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, session, isLoading, isSchoolInfoLoading, logout, ...schoolAdminInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
