// sfms/app/login/page.tsx
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner'; // Changed to import toast from 'sonner'
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import EyeIcon, EyeSlashIcon, and XMarkIcon
import { Dialog, Transition } from '@headlessui/react'; // Import Dialog and Transition for modal

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, session } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      console.log(
        'LoginPage: User detected and auth is loaded, redirecting to dashboard.'
      );
      router.replace('/dashboard');
    } else if (!isLoading && !user) {
      console.log(
        'LoginPage: No user and auth is loaded, staying on login page.'
      );
    } else {
      console.log('LoginPage: Auth is still loading (isLoading is true).');
    }
  }, [user, isLoading, router, session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Logging in...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Login successful! Redirecting...', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.', {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingResetEmail(true);
    const toastId = toast.loading('Sending password reset email...');

    try {
      const resetPasswordRedirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: resetPasswordRedirectUrl,
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Password reset link sent to your email!', { id: toastId });
        setShowForgotPasswordModal(false); // Close modal on success
        setForgotPasswordEmail(''); // Clear email field
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.', {
        id: toastId,
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="animate-pulse text-gray-700">Loading session...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
        <div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Log in to School Fee Manager.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="emailInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="emailInput"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150"
              />
            </div>
            <div>
              <label
                htmlFor="passwordInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeIcon className="h-5 w-5" /> // NEW: Open eye icon when password is shown
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" /> // NEW: Eye slash icon when password is hidden
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 mt-2 rounded-lg text-white font-semibold transition duration-150 ease-in-out text-base ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSubmitting ? 'Logging In...' : 'Login'}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <p className="text-sm text-center text-gray-600 mt-6">
            Need to register a new school?{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Sign Up Here
            </Link>
          </p>
        </div>

        {/* Forgot Password Modal */}
        <Transition appear show={showForgotPasswordModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowForgotPasswordModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex justify-between items-center">
                      Forgot Password
                      <button onClick={() => setShowForgotPasswordModal(false)} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </Dialog.Title>
                    <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-gray-700 mb-1">
                          Enter your email address:
                        </label>
                        <input
                          id="forgotPasswordEmail"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150"
                          disabled={isSendingResetEmail}
                        />
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setShowForgotPasswordModal(false)}
                          disabled={isSendingResetEmail}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingResetEmail || !forgotPasswordEmail.trim()}
                          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition duration-150 ease-in-out ${
                            isSendingResetEmail
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          }`}
                        >
                          {isSendingResetEmail ? 'Sending...' : 'Send Reset Link'}
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-gray-700">Redirecting...</div>
    </main>
  );
}
