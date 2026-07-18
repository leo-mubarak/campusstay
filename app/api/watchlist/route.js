// /api/watchlist — ported from api/watchlist.php (toggle + clear)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { q, q1 } from '@/lib/db';

async function token() {
  return (await cookies()).get('cs_wl')?.value || null;
}

export async function POST(request) {
  const t = await token();
  if (!t) return NextResponse.json({ success: false, message: 'No session. Please reload the page.' });

  const fd = await request.formData();
  const roomId = parseInt(fd.get('room_id') || 0, 10);
  if (!roomId) return NextResponse.json({ success: false, message: 'Invalid room.' });
  if (!(await q1('SELECT id FROM rooms WHERE id = $1', [roomId])))
    return NextResponse.json({ success: false, message: 'Room not found.' });

  const existing = await q1('SELECT id FROM watchlist WHERE session_token = $1 AND room_id = $2', [t, roomId]);
  if (existing) {
    await q('DELETE FROM watchlist WHERE id = $1', [existing.id]);
    return NextResponse.json({ success: true, action: 'removed', message: 'Removed from watchlist.' });
  }
  await q('INSERT INTO watchlist (session_token, room_id) VALUES ($1, $2)', [t, roomId]);
  return NextResponse.json({ success: true, action: 'added', message: 'Saved to your watchlist!' });
}

export async function GET(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') === 'clear') {
    const t = await token();
    if (t) await q('DELETE FROM watchlist WHERE session_token = $1', [t]);
    return NextResponse.redirect(new URL('/watchlist?success=' + encodeURIComponent('Watchlist cleared.'), url.origin), 303);
  }
  return NextResponse.redirect(new URL('/watchlist', url.origin), 303);
}
