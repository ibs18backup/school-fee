// ibs18backup/test3/test3-b14005fe3f8f548aa99919d56472d3ba4e64fcf1/app/api/superadmin-login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This API route handles the secure login for superadmin.
// It runs on the server, so environment variables here are safe.

export async function POST(request: Request) {
  const { username, password } = await request.json();

  // Retrieve environment variables directly (no NEXT_PUBLIC_)
  const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME;
  const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
  const SUPERADMIN_AUTH_TOKEN = process.env.SUPERADMIN_AUTH_TOKEN;

  if (!SUPERADMIN_USERNAME || !SUPERADMIN_PASSWORD || !SUPERADMIN_AUTH_TOKEN) {
    console.error('SERVER ERROR: Superadmin environment variables are not set.');
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  if (username === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD) {
    // Set a secure, HTTP-only cookie
    cookies().set('superadmin_token', SUPERADMIN_AUTH_TOKEN, {
      httpOnly: true, // Crucial: makes cookie inaccessible to client-side JS
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/', // Accessible across the entire domain
      sameSite: 'lax', // Protection against CSRF attacks
    });
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
  }
}