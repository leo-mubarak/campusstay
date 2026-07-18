// /api/admin — admin auth + moderation (recreated from README + schema;
// original admin/auth.php + admin/dashboard.php were not in the upload)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q, q1 } from '@/lib/db';
import { isAdmin, signSession, cookieOpts } from '@/lib/auth';
import { formatWhatsApp } from '@/lib/utils';

const go = (origin, path, params = {}) => {
  const url = new URL(path, origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
};

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const fd = await request.formData();
  const action = String(fd.get('action') || '');
  const val = k => String(fd.get(k) || '').trim();

  if (action === 'login') {
    const username = val('username'), password = val('password');
    const okUser = process.env.ADMIN_USERNAME || 'admin';
    const okPass = process.env.ADMIN_PASSWORD || '';
    if (username === okUser && okPass && password === okPass) {
      const token = await signSession({ admin: true });
      const res = go(origin, '/admin', { success: 'Welcome, Administrator.' });
      res.cookies.set('cs_admin', token, cookieOpts);
      return res;
    }
    return go(origin, '/admin/login', { error: 'Invalid admin credentials.' });
  }

  // Everything below requires an admin session
  if (!(await isAdmin())) return go(origin, '/admin/login', { error: 'Please log in.' });

  if (action === 'create_manager') {
    const fullName = val('full_name'), email = val('email'),
      hostelName = val('hostel_name'), password = val('password');
    if (!fullName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 6)
      return go(origin, '/admin', { tab: 'managers', error: 'All fields required; password min 6 chars.' });
    if (await q1('SELECT id FROM managers WHERE email = $1', [email]))
      return go(origin, '/admin', { tab: 'managers', error: 'A manager with that email already exists.' });
    await q('INSERT INTO managers (full_name, email, password, hostel_name) VALUES ($1,$2,$3,$4)',
      [fullName, email, bcrypt.hashSync(password, 10), hostelName]);
    return go(origin, '/admin', { tab: 'managers', success: 'Manager account created.' });
  }

  if (action === 'add_university') {
    const name = val('name');
    if (!name) return go(origin, '/admin', { tab: 'universities', error: 'University name is required.' });
    await q('INSERT INTO universities (name, short_name, location) VALUES ($1,$2,$3)',
      [name, val('short_name'), val('location')]);
    return go(origin, '/admin', { tab: 'universities', success: 'University added.' });
  }

  return go(origin, '/admin');
}

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    const res = go(origin, '/admin/login', { success: 'Logged out.' });
    res.cookies.set('cs_admin', '', { ...cookieOpts, maxAge: 0 });
    return res;
  }

  if (!(await isAdmin())) return go(origin, '/admin/login', { error: 'Please log in.' });
  const id = parseInt(url.searchParams.get('id') || 0, 10);

  switch (action) {
    case 'delete_manager':
      await q('DELETE FROM managers WHERE id = $1', [id]); // rooms cascade
      return go(origin, '/admin', { tab: 'managers', success: 'Manager deleted.' });
    case 'delete_university':
      await q('DELETE FROM universities WHERE id = $1', [id]); // rooms.university_id set null
      return go(origin, '/admin', { tab: 'universities', success: 'University deleted.' });
    case 'delete_room':
      await q('DELETE FROM rooms WHERE id = $1', [id]);
      return go(origin, '/admin', { tab: 'rooms', success: 'Room deleted.' });
    case 'approve_review':
      await q(`UPDATE reviews SET status='approved' WHERE id = $1`, [id]);
      return go(origin, '/admin', { tab: 'reviews', success: 'Review approved.' });
    case 'reject_review':
      await q(`UPDATE reviews SET status='rejected' WHERE id = $1`, [id]);
      return go(origin, '/admin', { tab: 'reviews', success: 'Review rejected.' });
    case 'delete_review':
      await q('DELETE FROM reviews WHERE id = $1', [id]);
      return go(origin, '/admin', { tab: 'reviews', success: 'Review deleted.' });
    default:
      return go(origin, '/admin');
  }
}
