'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) return { error: 'Wrong password' };
  let token: string;
  try {
    token = await createSessionToken();
  } catch {
    return { error: 'Server misconfiguration — check APP_SESSION_SECRET' };
  }
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  redirect('/slovenia');
}
