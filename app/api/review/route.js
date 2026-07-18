// POST /api/review — ported from php/review.php
import { NextResponse } from 'next/server';
import { q, q1 } from '@/lib/db';

const json = (success, message) => NextResponse.json({ success, message });

export async function POST(request) {
  const fd = await request.formData();
  const roomId = parseInt(fd.get('room_id') || 0, 10);
  const name = String(fd.get('reviewer_name') || '').trim();
  const email = String(fd.get('reviewer_email') || '').trim();
  const rating = parseInt(fd.get('rating') || 0, 10);
  const comment = String(fd.get('comment') || '').trim();

  const errors = [];
  if (!roomId) errors.push('Invalid room.');
  if (name.length < 2) errors.push('Your name is required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('Valid email is required.');
  if (rating < 1 || rating > 5) errors.push('Please select a rating (1–5 stars).');
  if (errors.length) return json(false, errors.join(' '));

  if (!(await q1('SELECT id FROM rooms WHERE id = $1', [roomId]))) return json(false, 'Room not found.');
  if (await q1('SELECT id FROM reviews WHERE room_id = $1 AND reviewer_email = $2', [roomId, email]))
    return json(false, 'You have already reviewed this room. Thank you!');

  await q(
    'INSERT INTO reviews (room_id, reviewer_name, reviewer_email, rating, comment) VALUES ($1,$2,$3,$4,$5)',
    [roomId, name, email, rating, comment || null]
  );
  return json(true, 'Thank you! Your review has been submitted.');
}
