// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/app/api/superadmin-logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  cookies().delete('superadmin_token'); // Clear the cookie
  return NextResponse.json({ success: true });
}