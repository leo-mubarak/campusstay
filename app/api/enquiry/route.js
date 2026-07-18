// POST /api/enquiry — ported from php/enquiry.php
import { NextResponse } from 'next/server';
import { q, q1 } from '@/lib/db';
import { formatWhatsApp } from '@/lib/utils';

const json = (success, message) => NextResponse.json({ success, message });

export async function POST(request) {
  const fd = await request.formData();
  const roomId = parseInt(fd.get('room_id') || 0, 10);
  const name = String(fd.get('student_name') || '').trim();
  const email = String(fd.get('student_email') || '').trim();
  const phone = String(fd.get('student_phone') || '').trim();
  const course = String(fd.get('student_course') || '').trim();
  const level = String(fd.get('student_level') || '').trim();
  const message = String(fd.get('message') || '').trim();

  const errors = [];
  if (!roomId) errors.push('Invalid room.');
  if (name.length < 2) errors.push('Your name is required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('Valid email is required.');
  if (message.length < 10) errors.push('Please write a message (at least 10 characters).');
  if (errors.length) return json(false, errors.join(' '));

  const room = await q1('SELECT id FROM rooms WHERE id = $1', [roomId]);
  if (!room) return json(false, 'Room not found.');

  const wa = phone ? formatWhatsApp(phone) : '';
  await q(
    `INSERT INTO enquiries (room_id, student_name, student_email, student_phone, student_whatsapp, student_course, student_level, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [roomId, name, email, phone, wa, course, level, message]
  );
  return json(true, 'Enquiry sent successfully! The manager will contact you shortly.');
}
