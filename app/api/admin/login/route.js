import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createAdminSessionToken } from '@/lib/adminAuth';

export async function POST(request) {
  const { password } = await request.json();

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ success: false, error: 'Senha incorreta.' }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
