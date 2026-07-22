// app/api/mobile/auth/route.js
// ADD THIS FILE to your campusstay GitHub repo at the path shown above.
// Token-based auth for the mobile app.
//
// POST JSON { action: 'login'|'register'|'admin_login'|'update_profile'|'change_password', ... }

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q, q1 } from '@/lib/db';
import { makeToken, readBearer } from '@/lib/mobileAuth';
import { formatWhatsApp } from '@/lib/utils';

const ok = (data) => NextResponse.json({ success: true, ...data });
const fail = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

const verify = (pw, hash) =>
  bcrypt.compareSync(pw, String(hash || '').replace(/^\$2y\$/, '$2b$'));

const validEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '');

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action;

    // ---- LOGIN ----
    if (action === 'login') {
      const email = String(body.email || '').trim();
      const mgr = await q1('SELECT * FROM managers WHERE email = $1 LIMIT 1', [email]);
      if (!mgr || !verify(String(body.password || ''), mgr.password)) {
        return fail('Invalid email or password. Please try again.');
      }
      const token = await makeToken({ id: mgr.id, name: mgr.full_name, email: mgr.email });
      return ok({
        manager: {
          id: mgr.id,
          name: mgr.full_name,
          email: mgr.email,
          phone: mgr.phone,
          whatsapp: mgr.whatsapp,
          token,
        },
      });
    }

    // ---- REGISTER ----
    if (action === 'register') {
      const fullName = String(body.full_name || '').trim();
      const email = String(body.email || '').trim();
      const errors = [];
      if (fullName.length < 2) errors.push('Full name is required.');
      if (!validEmail(email)) errors.push('A valid email address is required.');
      if (!body.password || body.password.length < 6) {
        errors.push('Password must be at least 6 characters.');
      }
      if (body.password !== body.confirm) errors.push('Passwords do not match.');
      if (!String(body.hostel_name || '').trim()) {
        errors.push('Hostel / property name is required.');
      }
      if (errors.length) return fail(errors.join(' '));

      if (await q1('SELECT id FROM managers WHERE email = $1', [email])) {
        return fail('An account with that email already exists. Please log in.');
      }

      const row = await q1(
        `INSERT INTO managers (full_name, email, password, phone, whatsapp, hostel_name)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          fullName,
          email,
          bcrypt.hashSync(body.password, 10),
          String(body.phone || '').trim(),
          body.whatsapp ? formatWhatsApp(body.whatsapp) : '',
          String(body.hostel_name || '').trim(),
        ]
      );

      const token = await makeToken({ id: row.id, name: fullName, email });
      return ok({ manager: { id: row.id, name: fullName, email, token } });
    }

    // ---- ADMIN LOGIN ----
    if (action === 'admin_login') {
      const okUser = process.env.ADMIN_USERNAME || 'admin';
      const okPass = process.env.ADMIN_PASSWORD || '';
      if (body.username === okUser && okPass && body.password === okPass) {
        const token = await makeToken({ admin: true });
        return ok({ token });
      }
      return fail('Invalid admin credentials.');
    }

    // ---- actions below need a Bearer token (logged-in manager) ----
    const session = await readBearer(request);
    if (!session || !session.id) return fail('Please log in.', 401);

    // ---- UPDATE PROFILE ----
    if (action === 'update_profile') {
      const fullName = String(body.full_name || '').trim();
      if (fullName.length < 2) return fail('Full name is required.');
      const whatsapp = body.whatsapp ? formatWhatsApp(body.whatsapp) : '';
      await q(
        'UPDATE managers SET full_name=$1, phone=$2, whatsapp=$3, updated_at=NOW() WHERE id=$4',
        [fullName, String(body.phone || '').trim(), whatsapp, Number(session.id)]
      );
      return ok({ message: 'Profile updated successfully.' });
    }

    // ---- CHANGE PASSWORD ----
    if (action === 'change_password') {
      const mgr = await q1('SELECT password FROM managers WHERE id = $1', [Number(session.id)]);
      if (!mgr || !verify(String(body.current_password || ''), mgr.password)) {
        return fail('Current password is incorrect.');
      }
      if (!body.new_password || body.new_password.length < 6) {
        return fail('New password must be at least 6 characters.');
      }
      if (body.new_password !== body.confirm_password) {
        return fail('Passwords do not match.');
      }
      await q(
        'UPDATE managers SET password=$1, updated_at=NOW() WHERE id=$2',
        [bcrypt.hashSync(body.new_password, 10), Number(session.id)]
      );
      return ok({ message: 'Password changed successfully.' });
    }

    return fail('Unknown action');
  } catch (error) {
    console.error('mobile/auth error:', error);
    return fail('Server error', 500);
  }
}
