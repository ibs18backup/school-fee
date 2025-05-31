// sfms/app/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';

// This ensures the page is rendered dynamically on each request,
// preventing prerendering issues with client-side hooks like useSearchParams.
export const dynamic = 'force-dynamic';

// --- Internal Component to safely use client-side hooks ---
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmittingNewPassword, setIsSubmittingNewPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [showSetNewPasswordForm, setShowSetNewPasswordForm] = useState(false); 
  const [isLoadingContent, setIsLoadingContent] = useState(true); // Loading state for this content component

  useEffect(() => {
    // Wait for auth to load before making decisions
    if (authLoading) {
      setIsLoadingContent(true);
      return;
    }

    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');

    const handleInitialLoad = async () => {
      if (user) {
        // Scenario 1: User is already authenticated (e.g., coming from Settings page)
        // They can directly set a new password without a token.
        setShowSetNewPasswordForm(true);
        toast.info('You are logged in. You can set a new password directly.');
      } else if (accessToken && type === 'recovery') {
        // Scenario 2: User is NOT authenticated, but has a password reset token from email
        // Validate the token and allow password reset.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !sessionData?.session) {
          console.error('Error getting session from token:', sessionError?.message);
          toast.error('Invalid or expired reset link. Please request a new one.');
          setShowSetNewPasswordForm(false); // Show error message instead of form
        } else {
          // Session is active due to the token, user is ready to set a new password
          setShowSetNewPasswordForm(true); // Show set new password form
          toast.success('Ready to set your new password!');
        }
      } else {
        // Scenario 3: User is NOT authenticated and no valid token is present
        // This means they navigated here directly without a valid email link.
        toast.error('Invalid or missing password reset link. Please request a new one from the login page.');
        setShowSetNewPasswordForm(false); // Show error message instead of form
      }
      setIsLoadingContent(false);
    };

    handleInitialLoad();
  }, [searchParams, user, authLoading]); // Depend on user and all loading states

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmittingNewPassword(true);
    const toastId = toast.loading('Setting new password...');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Password reset successfully! You can now log in with your new password.', { id: toastId, duration: 5000 });
        router.replace('/login');
      }
    } catch (err: any) {
      console.error('Password reset unexpected error:', err);
      toast.error(err.message || 'An unexpected error occurred.', {
        id: toastId,
      });
    } finally {
      setIsSubmittingNewPassword(false);
    }
  };

  if (isLoadingContent) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 animate-pulse">Loading password reset module...</p>
      </main>
    );
  }

  if (showSetNewPasswordForm) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
        <div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Set New Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your new password below.
            </p>
          </div>
          <form onSubmit={handleSetNewPassword} className="space-y-5">
            <div>
              <label htmlFor="newPasswordInput" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  id="newPasswordInput"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150"
                  disabled={isSubmittingNewPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmNewPasswordInput" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  id="confirmNewPasswordInput"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150"
                  disabled={isSubmittingNewPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmNewPassword ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmittingNewPassword}
              className={`w-full py-3 px-4 mt-2 rounded-lg text-white font-semibold transition duration-150 ease-in-out text-base ${
                isSubmittingNewPassword
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSubmittingNewPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
      <div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The password reset link is invalid, expired, or missing.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Please go to the login page and use the &quot;Forgot Password?&quot; option to request a new link.
          </p>
        </div>
        <div className="text-center mt-6">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Go to Login Page
          </Link>
        </div>
      </div>
    </main>
  );
}

// --- Main Page Component ---
// This wrapper ensures that the client-side hooks are only called
// after the component has mounted and is running in a browser environment.
export default function ResetPasswordPageWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a loading state or null during server-side render
    // This prevents useSearchParams from being called on the server
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 animate-pulse">Loading...</p>
      </main>
    );
  }

  return <ResetPasswordContent />;
}
