// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/app/superadmin/layout.tsx
'use client';

import { SuperadminAuthProvider } from '@/components/SuperadminAuthContext';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperadminAuthProvider>
      {children}
    </SuperadminAuthProvider>
  );
}