// lib/auth.js — cookie-based sessions (replaces PHP $_SESSION)
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

async function readSession(name) {
  const store = await cookies();
  const token = store.get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

// { id, name, email } of the logged-in manager, or null
export async function getManager() {
  const s = await readSession('cs_manager');
  return s ? { id: Number(s.id), name: s.name, email: s.email } : null;
}

export async function isAdmin() {
  return !!(await readSession('cs_admin'));
}

// Anonymous watchlist token (set by middleware.js on first visit)
export async function getWatchlistToken() {
  const store = await cookies();
  return store.get('cs_wl')?.value || null;
}

export const cookieOpts = { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 };
