// /api/auth — ported from php/auth.php (login, register, logout, profile, password)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q, q1 } from '@/lib/db';
import { getManager, signSession, cookieOpts } from '@/lib/auth';
import { formatWhatsApp } from '@/lib/utils';

const go = (origin, path, params = {}) => {
  const url = new URL(path, origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
};
// PHP's password_hash produces $2y$ hashes; bcryptjs expects $2a/$2b
const verify = (pw, hash) => bcrypt.compareSync(pw, String(hash || '').replace(/^\$2y\$/, '$2b$'));

export async function GET(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') === 'logout') {
    const res = go(url.origin, '/');
    res.cookies.set('cs_manager', '', { ...cookieOpts, maxAge: 0 });
    return res;
  }
  return go(url.origin, '/');
}

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const fd = await request.formData();
  const action = String(fd.get('action') || '');
  const val = k => String(fd.get(k) || '').trim();

  // ── LOGIN ──────────────────────────────────────────────
  if (action === 'login') {
    const email = val('email'), password = val('password');
    if (!email || !password) return go(origin, '/manager/login', { error: 'Email and password are required.' });

    const mgr = await q1('SELECT * FROM managers WHERE email = $1 LIMIT 1', [email]);
    if (mgr && verify(password, mgr.password)) {
      const token = await signSession({ id: mgr.id, name: mgr.full_name, email: mgr.email });
      const res = go(origin, '/manager/dashboard', { success: `Welcome back, ${mgr.full_name}!` });
      res.cookies.set('cs_manager', token, cookieOpts);
      return res;
    }
    return go(origin, '/manager/login', { error: 'Invalid email or password. Please try again.' });
  }

  // ── REGISTER ───────────────────────────────────────────
  if (action === 'register') {
    const fullName = val('full_name'), email = val('email'), password = val('password'),
      confirm = val('confirm'), phone = val('phone'), whatsapp = val('whatsapp'), hostelName = val('hostel_name');

    const errors = [];
    if (fullName.length < 2) errors.push('Full name is required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('A valid email address is required.');
    if (password.length < 6) errors.push('Password must be at least 6 characters.');
    if (password !== confirm) errors.push('Passwords do not match.');
    if (!hostelName) errors.push('Hostel / property name is required.');
    if (errors.length) return go(origin, '/manager/register', { error: errors.join(' ') });

    if (await q1('SELECT id FROM managers WHERE email = $1 LIMIT 1', [email]))
      return go(origin, '/manager/register', { error: 'An account with that email already exists. Please log in.' });

    const hash = bcrypt.hashSync(password, 10);
    const wa = whatsapp ? formatWhatsApp(whatsapp) : '';
    const row = await q1(
      'INSERT INTO managers (full_name, email, password, phone, whatsapp, hostel_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [fullName, email, hash, phone, wa, hostelName]
    );

    const token = await signSession({ id: row.id, name: fullName, email });
    const res = go(origin, '/manager/dashboard', {
      success: `Welcome, ${fullName}! Your account has been created. Start by adding your first room.`,
    });
    res.cookies.set('cs_manager', token, cookieOpts);
    return res;
  }

  // ── UPDATE PROFILE ─────────────────────────────────────
  if (action === 'update_profile') {
    const manager = await getManager();
    if (!manager) return go(origin, '/manager/login');
    const fullName = val('full_name');
    let whatsapp = val('whatsapp');
    if (fullName.length < 2)
      return go(origin, '/manager/dashboard', { tab: 'profile', error: 'Full name is required.' });
    if (whatsapp) whatsapp = formatWhatsApp(whatsapp);

    await q(
      `UPDATE managers SET full_name=$1, phone=$2, whatsapp=$3, hostel_name=$4,
       updated_at=NOW() WHERE id=$5`,
      [fullName, val('phone'), whatsapp, val('hostel_name'), manager.id]
    );

    const token = await signSession({ id: manager.id, name: fullName, email: manager.email });
    const res = go(origin, '/manager/dashboard', { tab: 'profile', success: 'Profile updated successfully.' });
    res.cookies.set('cs_manager', token, cookieOpts);
    return res;
  }

  // ── CHANGE PASSWORD ────────────────────────────────────
  if (action === 'change_password') {
    const manager = await getManager();
    if (!manager) return go(origin, '/manager/login');
    const current = String(fd.get('current_password') || '');
    const newPw = String(fd.get('new_password') || '');
    const confirmPw = String(fd.get('confirm_password') || '');
    const dash = params => go(origin, '/manager/dashboard', { tab: 'profile', ...params });

    const mgr = await q1('SELECT password FROM managers WHERE id = $1', [manager.id]);
    if (!mgr || !verify(current, mgr.password)) return dash({ error: 'Current password is incorrect.' });
    if (newPw.length < 6) return dash({ error: 'New password must be at least 6 characters.' });
    if (newPw !== confirmPw) return dash({ error: 'Passwords do not match.' });

    await q('UPDATE managers SET password=$1, updated_at=NOW() WHERE id=$2', [bcrypt.hashSync(newPw, 10), manager.id]);
    return dash({ success: 'Password changed successfully.' });
  }

  // ── DELETE ACCOUNT (manager deletes their own account) ──
  // Requires the current password. Deleting the manager row cascades:
  // their rooms, media, enquiries and reviews are removed too.
  if (action === 'delete_account') {
    const manager = await getManager();
    if (!manager) return go(origin, '/manager/login');
    const password = String(fd.get('password') || '');

    const mgr = await q1('SELECT password FROM managers WHERE id = $1', [manager.id]);
    if (!mgr || !verify(password, mgr.password)) {
      return go(origin, '/manager/dashboard', { tab: 'profile', error: 'Password is incorrect.' });
    }

    await q('DELETE FROM managers WHERE id = $1', [manager.id]);

    // Log them out (clear the session cookie) and send them home.
    const res = go(origin, '/', { success: 'Your account has been deleted.' });
    res.cookies.set('cs_manager', '', { ...cookieOpts, maxAge: 0 });
    return res;
  }

  return go(origin, '/');
}
