// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/app/superadmin/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Database } from '@/lib/database.types';
import {
  BuildingLibraryIcon,
  UsersIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useSuperadminAuth } from '@/components/SuperadminAuthContext'; // Ensure this import path is correct

// Define types for better readability and safety
type SchoolSummary = Database['public']['Tables']['schools']['Row'] & {
  student_count: number;
  total_assigned_fees: number;
  total_collected_fees: number;
};

type SchoolAdministratorDetail = Database['public']['Tables']['school_administrators']['Row'] & {
  schools?: { name: string | null } | null;
  user_email?: string | null;
};

export default function SuperadminPage() {
  const supabase = createClientComponentClient<Database>();
  const { logout } = useSuperadminAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [schoolsSummary, setSchoolsSummary] = useState<SchoolSummary[]>([]);
  const [totalSchools, setTotalSchools] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalAssignedFeesGlobal, setTotalAssignedFeesGlobal] = useState<number | null>(null);
  const [totalCollectedFeesGlobal, setTotalCollectedFeesGlobal] = useState<number | null>(null);
  const [schoolAdministrators, setSchoolAdministrators] = useState<SchoolAdministratorDetail[]>([]);

  const fetchSuperadminData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all schools with aggregated data for students and payments
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          *,
          students(id, total_fees, payments(amount_paid))
        `);

      if (schoolsError) throw schoolsError;

      let schoolsSummaryData: SchoolSummary[] = [];
      let globalStudentCount = 0;
      let globalAssignedFees = 0;
      let globalCollectedFees = 0;

      if (Array.isArray(schoolsData)) {
        schoolsData.forEach(school => {
          let schoolStudentCount = 0;
          let schoolAssignedFees = 0;
          let schoolCollectedFees = 0;

          if (Array.isArray(school.students)) {
            school.students.forEach(student => {
              schoolStudentCount++;
              globalStudentCount++;
              schoolAssignedFees += student.total_fees || 0;
              globalAssignedFees += student.total_fees || 0;

              if (Array.isArray(student.payments)) {
                student.payments.forEach(payment => {
                  schoolCollectedFees += payment.amount_paid || 0;
                  globalCollectedFees += payment.amount_paid || 0;
                });
              }
            });
          }

          schoolsSummaryData.push({
            ...school,
            student_count: schoolStudentCount,
            total_assigned_fees: schoolAssignedFees,
            total_collected_fees: schoolCollectedFees,
          });
        });
      }
      setSchoolsSummary(schoolsSummaryData);
      setTotalSchools(schoolsData?.length || 0);
      setTotalStudents(globalStudentCount);
      setTotalAssignedFeesGlobal(globalAssignedFees);
      setTotalCollectedFeesGlobal(globalCollectedFees);

      // Fetch all school administrators from your DB
      const { data: adminData, error: adminError } = await supabase
        .from('school_administrators')
        .select(`
          id, user_id, role, created_at, school_id, updated_at,
          schools(name)
        `)
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      const adminUserIds = (adminData || []).map(admin => admin.user_id);

      // Call the Supabase Function to get user emails
      let usersWithEmailsMap = new Map<string, string>();
      if (adminUserIds.length > 0) {
        const { data: functionResult, error: functionError } = await supabase.functions.invoke('get-admin-users-with-emails', {
          body: JSON.stringify({ adminUserIds }),
        });

        if (functionError) {
          console.error('Error invoking function:', functionError.message);
          toast.error('Failed to fetch user emails from backend function.');
        } else if (functionResult && functionResult.data && Array.isArray(functionResult.data.data)) {
          functionResult.data.data.forEach((user: { userId: string, email: string | null }) => {
            if (user.email) {
              usersWithEmailsMap.set(user.userId, user.email);
            }
          });
        } else {
          console.warn('Function did not return expected data:', functionResult);
        }
      }

      // Combine admin data with fetched emails
      const enrichedAdminData: SchoolAdministratorDetail[] = (adminData || []).map(admin => ({
        ...admin,
        user_email: usersWithEmailsMap.get(admin.user_id) || null
      }));

      setSchoolAdministrators(enrichedAdminData);

    } catch (error: any) {
      toast.error(`Failed to load superadmin data: ${error.message}`);
      console.error('Superadmin data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSuperadminData();
  }, [fetchSuperadminData]);

  // Helper component for statistics cards
  const StatCard = ({ title, value, icon, colorClass }: { title: string; value: string | number | null; icon: React.ReactNode; colorClass: string }) => (
    <div className="p-5 rounded-xl shadow-lg bg-white">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${colorClass}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      {isLoading ? (
        <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded-md mt-1"></div>
      ) : (
        <p className="mt-1 text-3xl font-semibold text-gray-900">
          {typeof value === 'number' && !title.toLowerCase().includes('schools') && !title.toLowerCase().includes('students') ? `₹${value.toLocaleString('en-IN')}` : value ?? 'N/A'}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Superadmin Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Global Statistics Cards */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Schools" value={totalSchools} icon={<BuildingLibraryIcon className="h-7 w-7" />} colorClass="text-blue-600 bg-blue-100" />
          <StatCard title="Total Students" value={totalStudents} icon={<UsersIcon className="h-7 w-7" />} colorClass="text-purple-600 bg-purple-100" />
          <StatCard title="Global Assigned Fees" value={totalAssignedFeesGlobal} icon={<BanknotesIcon className="h-7 w-7" />} colorClass="text-indigo-600 bg-indigo-100" />
          <StatCard title="Global Collected Fees" value={totalCollectedFeesGlobal} icon={<ReceiptPercentIcon className="h-7 w-7" />} colorClass="text-green-600 bg-green-100" />
        </section>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <p className="text-xl font-medium">Fetching global data...</p>
          </div>
        ) : (
          <>
            {/* Schools Overview Table */}
            <section className="bg-white shadow-xl rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <BuildingLibraryIcon className="h-6 w-6 text-gray-500 mr-2" /> All Schools Overview
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">School Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">School ID</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Students</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned Fees (₹)</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Collected Fees (₹)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Registered On</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schoolsSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No schools registered yet.</td>
                      </tr>
                    ) : (
                      schoolsSummary.map((school) => (
                        <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{school.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{school.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{school.student_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">₹{school.total_assigned_fees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">₹{school.total_collected_fees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(school.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* School Administrators/Users Table */}
            <section className="bg-white shadow-xl rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <UserGroupIcon className="h-6 w-6 text-gray-500 mr-2" /> School Administrators
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">School Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Registered On</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schoolAdministrators.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No school administrators found.</td>
                      </tr>
                    ) : (
                      schoolAdministrators.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{admin.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{admin.user_email || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.schools?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{admin.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(admin.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <p className="mt-4 text-xs text-gray-500 italic">
                  Note: User emails are fetched via a backend Supabase Function for security.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}