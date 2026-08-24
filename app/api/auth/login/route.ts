import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
    }

    const token = await createAdminSessionToken();

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      role: 'admin'
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
