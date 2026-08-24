import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  return NextResponse.json({
    authenticated: isAdmin,
    role: isAdmin ? 'admin' : 'guest'
  });
}
