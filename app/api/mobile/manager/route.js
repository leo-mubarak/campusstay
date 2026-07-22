// app/api/mobile/manager/route.js
// ADD THIS FILE to your campusstay GitHub repo at the path shown above.
// Manager dashboard data + room CRUD + admin panel.
//
// GET  ?view=dashboard   (Bearer manager)  -> stats, rooms, enquiries, reviews
// GET  ?view=admin       (Bearer admin)    -> managers, universities, rooms, reviews
// POST multipart action=save              -> create/update room (+ photo uploads)
// POST JSON action=delete|delete-media|delete-enquiry|delete-review|mark-read
// POST JSON admin actions: create_manager|add_university|delete_manager|
//                          delete_university|delete_room|approve_review|
//                          reject_review|delete_admin_review

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { put } from '@vercel/blob';
import { q, q1 } from '@/lib/db';
import { readBearer } from '@/lib/mobileAuth';
import { VALID_TYPES, VALID_GENDERS } from '@/lib/utils';

const ok = (data) => NextResponse.json({ success: true, ...data });
const fail = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

// Notify watchlist watchers that a room just became Fully Booked.
async function notifyWatchlist(roomId, hostel, ident) {
  const rows = await q('SELECT session_token FROM watchlist WHERE room_id = $1', [roomId]);
  const msg = `⚠ ${hostel} — ${ident} is now Fully Booked.`;
  for (const { session_token } of rows) {
    const dup = await q1(
      `SELECT id FROM watchlist_notifications
       WHERE session_token=$1 AND room_id=$2 AND message=$3
       AND created_at > NOW() - INTERVAL '1 day'`,
      [session_token, roomId, msg]
    );
    if (!dup) {
      await q(
        'INSERT INTO watchlist_notifications (session_token, room_id, message) VALUES ($1,$2,$3)',
        [session_token, roomId, msg]
      );
    }
  }
}

// ============================================================
export async function GET(request) {
  const session = await readBearer(request);
  if (!session) return fail('Please log in.', 401);

  const view = new URL(request.url).searchParams.get('view');

  try {
    // ---- Dashboard (manager) ----
    if (view === 'dashboard' && session.id) {
      const mid = Number(session.id);
      const rooms = await q(
        `SELECT r.*, u.short_name AS uni_short
         FROM rooms r LEFT JOIN universities u ON r.university_id = u.id
         WHERE r.manager_id = $1 ORDER BY r.created_at DESC`,
        [mid]
      );
      const enquiries = await q(
        `SELECT e.*, r.hostel_name, r.room_identifier
         FROM enquiries e JOIN rooms r ON e.room_id = r.id
         WHERE r.manager_id = $1 ORDER BY e.created_at DESC`,
        [mid]
      );
      const reviews = await q(
        `SELECT rv.*, r.hostel_name, r.room_identifier
         FROM reviews rv JOIN rooms r ON rv.room_id = r.id
         WHERE r.manager_id = $1 ORDER BY rv.created_at DESC`,
        [mid]
      );
      const stats = {
        total: rooms.length,
        avail: rooms.filter((r) => r.availability === 'Available').length,
        full: rooms.filter((r) => r.availability === 'Fully Booked').length,
        unread: enquiries.filter((e) => e.status === 'unread').length,
        reviews: reviews.filter((rv) => rv.status === 'approved').length,
      };
      return ok({ stats, rooms, enquiries, reviews });
    }

    // ---- Admin panel ----
    if (view === 'admin' && session.admin) {
      const managers = await q(
        `SELECT m.id, m.full_name, m.email, m.phone, m.hostel_name, m.created_at,
                (SELECT COUNT(*)::int FROM rooms WHERE manager_id = m.id) AS room_count
         FROM managers m ORDER BY m.created_at DESC`
      );
      const universities = await q(
        `SELECT u.*, (SELECT COUNT(*)::int FROM rooms WHERE university_id = u.id) AS room_count
         FROM universities u ORDER BY u.name`
      );
      const rooms = await q(
        `SELECT r.*, m.full_name AS manager_name, u.short_name AS uni_short
         FROM rooms r JOIN managers m ON r.manager_id = m.id
         LEFT JOIN universities u ON r.university_id = u.id
         ORDER BY r.created_at DESC`
      );
      const reviews = await q(
        `SELECT rv.*, r.hostel_name, r.room_identifier
         FROM reviews rv JOIN rooms r ON rv.room_id = r.id
         ORDER BY rv.created_at DESC`
      );
      return ok({ managers, universities, rooms, reviews });
    }

    return fail('Unknown view or wrong account type');
  } catch (error) {
    console.error('mobile/manager GET error:', error);
    return fail('Server error', 500);
  }
}

// ============================================================
export async function POST(request) {
  const session = await readBearer(request);
  if (!session) return fail('Please log in.', 401);

  const contentType = request.headers.get('content-type') || '';

  try {
    // ---- multipart = save room (create or update) ----
    if (contentType.includes('multipart/form-data')) {
      if (!session.id) return fail('Manager account required.', 403);
      const mid = Number(session.id);
      const fd = await request.formData();
      const val = (key) => String(fd.get(key) || '').trim();

      const hostelName = val('hostel_name');
      const roomIdentifier = val('room_identifier');
      const roomType = val('room_type');
      const genderSpec = val('gender_spec');
      const universityId = Number(fd.get('university_id')) || 0;
      const annualPrice = Number(fd.get('annual_price')) || 0;
      const availability = val('availability') || 'Available';
      let roomId = Number(fd.get('room_id')) || 0;

      const errors = [];
      if (!hostelName) errors.push('Hostel name is required.');
      if (!roomIdentifier) errors.push('Room identifier is required.');
      if (!VALID_TYPES.includes(roomType)) errors.push('Invalid room type.');
      if (!VALID_GENDERS.includes(genderSpec)) errors.push('Invalid gender specification.');
      if (annualPrice <= 0) errors.push('Annual price must be greater than 0.');
      if (universityId <= 0) errors.push('Please select a university.');
      if (errors.length) return fail(errors.join(' '));

      const values = [
        hostelName, roomIdentifier, roomType, genderSpec, universityId,
        annualPrice,
        Number(fd.get('semester_price')) || 0,
        Number(fd.get('distance_km')) || 0,
        Number(fd.get('walk_minutes')) || 0,
        availability,
        val('amenities'),
        val('description'),
      ];

      if (roomId > 0) {
        // Update existing
        const owns = await q1('SELECT id FROM rooms WHERE id=$1 AND manager_id=$2', [roomId, mid]);
        if (!owns) return fail('Room not found or access denied.', 403);
        await q(
          `UPDATE rooms SET hostel_name=$1, room_identifier=$2, room_type=$3, gender_spec=$4,
           university_id=$5, annual_price=$6, semester_price=$7, distance_km=$8, walk_minutes=$9,
           availability=$10, amenities=$11, description=$12, updated_at=NOW()
           WHERE id=$13 AND manager_id=$14`,
          [...values, roomId, mid]
        );
        if (availability === 'Fully Booked') {
          await notifyWatchlist(roomId, hostelName, roomIdentifier);
        }
      } else {
        // Create new
        const row = await q1(
          `INSERT INTO rooms (hostel_name, room_identifier, room_type, gender_spec, university_id,
           annual_price, semester_price, distance_km, walk_minutes, availability, amenities,
           description, manager_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
          [...values, mid]
        );
        roomId = row.id;
      }

      // Photo uploads -> Vercel Blob
      const files = fd.getAll('media_files').filter(
        (file) => file && typeof file === 'object' && file.size > 0
      );
      if (files.length && process.env.BLOB_READ_WRITE_TOKEN) {
        let sort = Number(
          (await q1('SELECT COALESCE(MAX(sort_order),0)+1 s FROM media WHERE room_id=$1', [roomId]))?.s || 1
        );
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) continue;
          const isImage = (file.type || '').startsWith('image/');
          const isVideo = (file.type || '').startsWith('video/');
          if (!isImage && !isVideo) continue;
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const key = `rooms/room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          try {
            const blob = await put(key, file, { access: 'public' });
            await q(
              'INSERT INTO media (room_id, file_name, file_path, media_type, sort_order) VALUES ($1,$2,$3,$4,$5)',
              [roomId, key.split('/').pop(), blob.url, isImage ? 'photo' : 'video', sort++]
            );
          } catch (uploadError) {
            console.error('Blob upload failed:', uploadError);
          }
        }
      }

      return ok({ room_id: roomId, message: 'Room listing saved successfully.' });
    }

    // ---- JSON actions ----
    const body = await request.json();
    const action = body.action;
    const id = Number(body.id) || 0;

    // Manager mutations
    if (session.id) {
      const mid = Number(session.id);

      if (action === 'delete') {
        const owns = await q1('SELECT id FROM rooms WHERE id=$1 AND manager_id=$2', [id, mid]);
        if (!owns) return fail('Not found or access denied.', 403);
        await q('DELETE FROM rooms WHERE id=$1', [id]);
        return ok({ message: 'Listing deleted.' });
      }

      if (action === 'delete-media') {
        const media = await q1(
          'SELECT m.id FROM media m JOIN rooms r ON m.room_id=r.id WHERE m.id=$1 AND r.manager_id=$2',
          [id, mid]
        );
        if (!media) return fail('Not found or access denied.', 403);
        await q('DELETE FROM media WHERE id=$1', [id]);
        return ok({ message: 'Media deleted.' });
      }

      if (action === 'delete-enquiry') {
        const owns = await q1(
          'SELECT e.id FROM enquiries e JOIN rooms r ON e.room_id=r.id WHERE e.id=$1 AND r.manager_id=$2',
          [id, mid]
        );
        if (!owns) return fail('Not found.', 403);
        await q('DELETE FROM enquiries WHERE id=$1', [id]);
        return ok({ message: 'Enquiry deleted.' });
      }

      if (action === 'delete-review') {
        const owns = await q1(
          'SELECT rv.id FROM reviews rv JOIN rooms r ON rv.room_id=r.id WHERE rv.id=$1 AND r.manager_id=$2',
          [id, mid]
        );
        if (!owns) return fail('Not found.', 403);
        await q('DELETE FROM reviews WHERE id=$1', [id]);
        return ok({ message: 'Review deleted.' });
      }

      if (action === 'mark-read') {
        await q(
          `UPDATE enquiries SET status='read' WHERE status='unread'
           AND room_id IN (SELECT id FROM rooms WHERE manager_id = $1)`,
          [mid]
        );
        return ok({});
      }
    }

    // Admin mutations
    if (session.admin) {
      if (action === 'create_manager') {
        if (
          !body.full_name ||
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '') ||
          !body.password ||
          body.password.length < 6
        ) {
          return fail('All fields required; password min 6 chars.');
        }
        if (await q1('SELECT id FROM managers WHERE email = $1', [body.email.trim()])) {
          return fail('A manager with that email already exists.');
        }
        await q(
          'INSERT INTO managers (full_name, email, password, hostel_name) VALUES ($1,$2,$3,$4)',
          [
            body.full_name.trim(),
            body.email.trim(),
            bcrypt.hashSync(body.password, 10),
            String(body.hostel_name || '').trim(),
          ]
        );
        return ok({ message: 'Manager account created.' });
      }

      if (action === 'add_university') {
        if (!String(body.name || '').trim()) return fail('University name is required.');
        await q('INSERT INTO universities (name, short_name, location) VALUES ($1,$2,$3)', [
          body.name.trim(),
          String(body.short_name || '').trim(),
          String(body.location || '').trim(),
        ]);
        return ok({ message: 'University added.' });
      }

      if (action === 'delete_manager') {
        await q('DELETE FROM managers WHERE id=$1', [id]);
        return ok({});
      }
      if (action === 'delete_university') {
        await q('DELETE FROM universities WHERE id=$1', [id]);
        return ok({});
      }
      if (action === 'delete_room') {
        await q('DELETE FROM rooms WHERE id=$1', [id]);
        return ok({});
      }
      if (action === 'approve_review') {
        await q(`UPDATE reviews SET status='approved' WHERE id=$1`, [id]);
        return ok({});
      }
      if (action === 'reject_review') {
        await q(`UPDATE reviews SET status='rejected' WHERE id=$1`, [id]);
        return ok({});
      }
      if (action === 'delete_admin_review') {
        await q('DELETE FROM reviews WHERE id=$1', [id]);
        return ok({});
      }
    }

    return fail('Unknown action');
  } catch (error) {
    console.error('mobile/manager POST error:', error);
    return fail('Server error', 500);
  }
}
