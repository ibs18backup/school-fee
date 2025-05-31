// sfms/app/dashboard/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthContext';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline'; // Removed BuildingLibraryIcon
import { Database } from '@/lib/database.types';

export default function SettingsPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  // Removed schoolId, isSchoolInfoLoading, isAdmin as they are no longer used in this component after removing school info section
  const { user, isLoading: authLoading } = useAuth(); 

  const [fullName, setFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  // Removed isLoadingSchoolName and schoolName states

  // Effect to initialize fullName from user profile
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || user.email || '');
    }
  }, [user]);

  // Removed useEffect for fetching school name as the section is removed
  /*
  useEffect(() => {
    const fetchSchoolName = async () => {
      setIsLoadingSchoolName(true); 

      if (!schoolId) {
        console.log('SettingsPage: No schoolId available from AuthContext. Cannot fetch school name.');
        setSchoolName('Not linked to a school');
        if (!isSchoolInfoLoading) { 
           toast.info("Your account is not currently linked to a school.");
        }
        setIsLoadingSchoolName(false);
        return;
      }

      console.log(`SettingsPage: Attempting to fetch school name for schoolId: "${schoolId}"`);
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .maybeSingle(); 

        if (error) {
          console.error('SettingsPage: Database error fetching school name:', error.message);
          setSchoolName('Failed to load');
          toast.error(`Failed to load school name: ${error.message}`);
        } else if (data) {
          setSchoolName(data.name || 'N/A');
          console.log(`SettingsPage: Successfully fetched school name: "${data.name}" for ID: "${schoolId}" from 'schools' table.`);
        } else {
          console.warn(`SettingsPage: School record for ID "${schoolId}" from school_administrators does NOT have a matching record in 'schools' table (maybeSingle returned null). This indicates a data inconsistency.`);
          toast.error("Data inconsistency: Linked school ID not found in schools table.");
        }
      } catch (runtimeError: any) {
        console.error('SettingsPage: Unexpected error during school name fetch:', runtimeError.message);
        setSchoolName('Error loading');
        toast.error(`An unexpected error occurred while fetching school name: ${runtimeError.message}`);
      } finally {
        setIsLoadingSchoolName(false);
        console.log('SettingsPage: Finished school name fetch attempt.');
      }
    };

    if (user && !authLoading && !isSchoolInfoLoading) { 
      fetchSchoolName();
    } else if (!user && !authLoading) {
      setSchoolName('Not linked to a school'); 
      setIsLoadingSchoolName(false);
    }
  }, [supabase, user, schoolId, authLoading, isSchoolInfoLoading]);
  */

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to update your profile.');
      return;
    }

    setIsUpdatingProfile(true);
    const toastId = toast.loading('Updating profile...');

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Profile updated successfully!', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.', { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordResetFromSettings = () => {
    router.push('/reset-password');
  };

  if (authLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 animate-pulse">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    router.replace('/login');
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Your Settings</h1>

        <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <UserCircleIcon className="h-6 w-6 mr-2 text-indigo-600" /> Personal Information
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isUpdatingProfile}
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdatingProfile ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </form>
        </div>

        {/* Removed School Information Section */}
        {/*
        <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <BuildingLibraryIcon className="h-6 w-6 mr-2 text-purple-600" /> School Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">School Name:</p>
              {isLoadingSchoolName ? (
                <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded-md mt-1"></div>
              ) : (
                <p className="text-base text-gray-900 font-semibold">{schoolName}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Role:</p>
              <p className="text-base text-gray-900 font-semibold">{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </div>
        */}

        <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <KeyIcon className="h-6 w-6 mr-2 text-red-600" /> Security
          </h2>
          <p className="text-gray-700 mb-4">
            Click the button below to reset your password. You will receive an email with a reset link.
          </p>
          <button
            onClick={handlePasswordResetFromSettings}
            className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
