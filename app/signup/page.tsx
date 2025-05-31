// sfms/app/signup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'sonner'; // Ensure sonner is imported correctly
import { useAuth } from '@/components/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Import eye icons

export default function SignupPage() {
  const router = useRouter();
  const { user, schoolId, isLoading: authIsLoading } = useAuth();

  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  useEffect(() => {
    if (!authIsLoading && user && schoolId) {
      router.replace('/dashboard'); // Already logged in and set up
    }
  }, [user, schoolId, authIsLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Creating your school and admin account...');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-school-and-admin', {
        body: { schoolName, adminEmail: email, adminPassword: password },
      });

      if (functionError) {
        let errorMessage = functionError.message || 'An unknown error occurred.';
        
        // Attempt to parse the detailed error from the Edge Function's response body string.
        // The Edge Function is designed to return {"error": "..."} for non-2xx codes.
        const responseBodyMatch = functionError.message.match(/\{"error":"(.*?)"\}/);
        if (responseBodyMatch && responseBodyMatch[1]) {
            errorMessage = responseBodyMatch[1]; // Extract the specific error message
        } else if (functionError.message.includes('Edge Function returned a non-2xx code')) {
            // Fallback for generic non-2xx message if specific error body not parsed
            errorMessage = "An unexpected server error occurred. Please try again.";
        }

        // Apply user-friendly messages for known errors from the Edge Function
        if (errorMessage.includes('User with this email already exists.')) {
          errorMessage = 'This email is already registered. Please log in or use "Forgot Password".';
        } else if (errorMessage.includes('School name "') && errorMessage.includes('" is already taken.')) {
          errorMessage = `School name "${schoolName}" is already taken. Please choose a different name.`;
        } else if (errorMessage.includes('Failed to send a request to the Edge Function')) {
            errorMessage = 'Network error or server unavailable. Please check your connection and try again.';
        }

        toast.error(errorMessage, { id: toastId });
        return; // Exit early as the error is handled
      }
      
      if (data && data.error) {
        // This block handles cases where the Edge Function returns a 2xx status,
        // but its *internal logic* resulted in an error, which it then puts into `data.error`.
        toast.error(data.error, { id: toastId });
        return; // Exit early as the error is handled
      }
      
      // If no functionError and no data.error, it's a success
      toast.success('School & admin account created! Please check your email for a verification link before logging in.', { id: toastId, duration: 6000 });
      router.push('/login');

    } catch (err: any) {
      // This catch block will primarily handle unexpected runtime errors in the frontend code
      console.error('Signup page unexpected error:', err);
      toast.error(err.message || 'An unexpected error occurred during signup.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authIsLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 animate-pulse">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-500 p-4">
      <div className="w-full max-w-lg p-8 sm:p-10 space-y-6 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Register Your School</h2>
            <p className="mt-2 text-sm text-gray-600">Create an admin account and get started.</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input id="schoolName" type="text" placeholder="e.g., Bright Futures Academy" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Your Admin Email
            </label>
            <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150" />
            <p className="mt-1 text-xs text-red-500">
              Please ensure you enter a **correct and accessible email address**.
            </p>
          </div>
          <div>
            <label htmlFor="passwordInput" className="block text-sm font-medium text-gray-700 mb-1">Choose a Password</label>
            <div className="relative">
              <input id="passwordInput" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || authIsLoading} className={`w-full py-3 px-4 mt-2 rounded-lg text-white font-semibold transition duration-150 ease-in-out text-base ${ (isSubmitting || authIsLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' }`} >
            {isSubmitting ? 'Processing...' : 'Create School & Admin'}
          </button>
           <p className="mt-2 text-xs text-red-500 text-center">
            This email is used for account verification and password recovery. If an incorrect email is provided and you lose access to your password, we cannot be held responsible for data loss or account recovery.
          </p>
        </form>
        <p className="text-sm text-center text-gray-600 mt-6">
          Already registered your school?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
