// lib/mobileAuth.js — Bearer-token auth for the mobile API routes.
// Add this file to your campusstay GitHub repo at: lib/mobileAuth.js
// Uses the same SESSION_SECRET as the website cookies.

import { SignJWT, jwtVerify } from 'jose';

const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');

// Create a token for the mobile app (30 days).
export async function makeToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

// Read "Authorization: Bearer <token>" from a request. Returns payload or null.
export async function readBearer(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), secret());
    return payload;
  } catch {
    return null;
  }
}
