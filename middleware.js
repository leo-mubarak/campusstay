// middleware.js — gives every visitor an anonymous watchlist token cookie
// (replaces the PHP session token in getWatchlistToken())
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  if (!request.cookies.get('cs_wl')) {
    const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
    response.cookies.set('cs_wl', token, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
