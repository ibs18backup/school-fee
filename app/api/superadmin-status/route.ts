// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/app/api/superadmin-status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const superadminToken = cookies().get('superadmin_token');
  const expectedToken = process.env.SUPERADMIN_AUTH_TOKEN;

  if (superadminToken && superadminToken.value === expectedToken) {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}