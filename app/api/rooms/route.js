// /api/rooms — ported from php/room-handler.php
// Handles: save (create/update + uploads + watchlist notify), delete room/media/enquiry/review
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { q, q1 } from '@/lib/db';
import { getManager } from '@/lib/auth';
import { VALID_TYPES, VALID_GENDERS } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const go = (origin, path, params = {}) => {
  const url = new URL(path, origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
};

async function notifyWatchlist(roomId, hostel, ident) {
  const rows = await q('SELECT session_token FROM watchlist WHERE room_id = $1', [roomId]);
  const msg = `⚠ ${hostel} — ${ident} is now Fully Booked.`;
  for (const { session_token } of rows) {
    const dup = await q1(
      `SELECT id FROM watchlist_notifications
       WHERE session_token=$1 AND room_id=$2 AND message=$3 AND created_at > NOW() - INTERVAL '1 day'`,
      [session_token, roomId, msg]
    );
    if (!dup) {
      await q('INSERT INTO watchlist_notifications (session_token, room_id, message) VALUES ($1,$2,$3)',
        [session_token, roomId, msg]);
    }
  }
}

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const manager = await getManager();
  if (!manager) return go(origin, '/manager/login');
  const mid = manager.id;

  const fd = await request.formData();
  if (String(fd.get('action')) !== 'save') return go(origin, '/manager/dashboard');

  const val = k => String(fd.get(k) || '').trim();
  const hostelName = val('hostel_name');
  const roomIdentifier = val('room_identifier');
  const roomType = val('room_type');
  const genderSpec = val('gender_spec');
  const universityId = parseInt(fd.get('university_id') || 0, 10) || 0;
  const annualPrice = parseFloat(fd.get('annual_price') || 0) || 0;
  const semesterPrice = parseFloat(fd.get('semester_price') || 0) || 0;
  const distanceKm = parseFloat(fd.get('distance_km') || 0) || 0;
  const walkMinutes = parseInt(fd.get('walk_minutes') || 0, 10) || 0;
  const availability = val('availability') || 'Available';
  const amenities = val('amenities');
  const description = val('description');
  let roomId = parseInt(fd.get('room_id') || 0, 10) || 0;

  const errors = [];
  if (!hostelName) errors.push('Hostel name is required.');
  if (!roomIdentifier) errors.push('Room identifier is required.');
  if (!VALID_TYPES.includes(roomType)) errors.push('Invalid room type.');
  if (!VALID_GENDERS.includes(genderSpec)) errors.push('Invalid gender specification.');
  if (annualPrice <= 0) errors.push('Annual price must be greater than 0.');
  if (!['Available', 'Fully Booked'].includes(availability)) errors.push('Invalid availability value.');
  if (universityId <= 0) errors.push('Please select a university.');
  if (errors.length) {
    return go(origin, roomId > 0 ? `/manager/rooms/${roomId}/edit` : '/manager/rooms/new', { error: errors.join(' ') });
  }

  if (roomId > 0) {
    const owns = await q1('SELECT id FROM rooms WHERE id=$1 AND manager_id=$2', [roomId, mid]);
    if (!owns) return go(origin, '/manager/dashboard', { error: 'Room not found or access denied.' });
    await q(
      `UPDATE rooms SET hostel_name=$1, room_identifier=$2, room_type=$3, gender_spec=$4, university_id=$5,
        annual_price=$6, semester_price=$7, distance_km=$8, walk_minutes=$9, availability=$10,
        amenities=$11, description=$12, updated_at=NOW() WHERE id=$13 AND manager_id=$14`,
      [hostelName, roomIdentifier, roomType, genderSpec, universityId, annualPrice, semesterPrice,
        distanceKm, walkMinutes, availability, amenities, description, roomId, mid]
    );
    if (availability === 'Fully Booked') await notifyWatchlist(roomId, hostelName, roomIdentifier);
  } else {
    const row = await q1(
      `INSERT INTO rooms (manager_id, university_id, hostel_name, room_identifier, room_type, gender_spec,
        annual_price, semester_price, distance_km, walk_minutes, availability, amenities, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [mid, universityId, hostelName, roomIdentifier, roomType, genderSpec, annualPrice, semesterPrice,
        distanceKm, walkMinutes, availability, amenities, description]
    );
    roomId = row.id;
  }

  // File uploads → Vercel Blob (only if configured)
  const files = fd.getAll('media_files').filter(f => f && typeof f === 'object' && f.size > 0);
  if (files.length && process.env.BLOB_READ_WRITE_TOKEN) {
    let sort = Number((await q1('SELECT COALESCE(MAX(sort_order),0)+1 AS s FROM media WHERE room_id=$1', [roomId]))?.s || 1);
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue;
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) continue;
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const key = `rooms/room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      try {
        const blob = await put(key, file, { access: 'public' });
        await q('INSERT INTO media (room_id, file_name, file_path, media_type, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [roomId, key.split('/').pop(), blob.url, isImage ? 'photo' : 'video', sort++]);
      } catch (e) {
        console.error('Blob upload failed:', e);
      }
    }
  }

  return go(origin, '/manager/dashboard', { tab: 'listings', success: 'Room listing saved successfully.' });
}

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const action = url.searchParams.get('action');
  const manager = await getManager();
  if (!manager) return go(origin, '/manager/login');
  const mid = manager.id;

  if (action === 'delete') {
    const roomId = parseInt(url.searchParams.get('id') || 0, 10);
    const owns = await q1('SELECT id FROM rooms WHERE id=$1 AND manager_id=$2', [roomId, mid]);
    if (owns) {
      await q('DELETE FROM rooms WHERE id=$1 AND manager_id=$2', [roomId, mid]); // media cascades
      return go(origin, '/manager/dashboard', { tab: 'listings', success: 'Listing deleted.' });
    }
    return go(origin, '/manager/dashboard', { tab: 'listings', error: 'Room not found or access denied.' });
  }

  if (action === 'delete-media') {
    const mediaId = parseInt(url.searchParams.get('media_id') || 0, 10);
    const media = await q1(
      'SELECT m.id FROM media m JOIN rooms r ON m.room_id=r.id WHERE m.id=$1 AND r.manager_id=$2', [mediaId, mid]);
    if (media) {
      await q('DELETE FROM media WHERE id=$1', [mediaId]);
      return NextResponse.json({ success: true, message: 'Media deleted.' });
    }
    return NextResponse.json({ success: false, message: 'Not found or access denied.' });
  }

  if (action === 'delete-enquiry') {
    const id = parseInt(url.searchParams.get('id') || 0, 10);
    const owns = await q1(
      'SELECT e.id FROM enquiries e JOIN rooms r ON e.room_id=r.id WHERE e.id=$1 AND r.manager_id=$2', [id, mid]);
    if (owns) {
      await q('DELETE FROM enquiries WHERE id=$1', [id]);
      return go(origin, '/manager/dashboard', { tab: 'enquiries', success: 'Enquiry deleted.' });
    }
    return go(origin, '/manager/dashboard', { tab: 'enquiries', error: 'Enquiry not found.' });
  }

  if (action === 'delete-review') {
    const id = parseInt(url.searchParams.get('id') || 0, 10);
    const owns = await q1(
      'SELECT rv.id FROM reviews rv JOIN rooms r ON rv.room_id=r.id WHERE rv.id=$1 AND r.manager_id=$2', [id, mid]);
    if (owns) {
      await q('DELETE FROM reviews WHERE id=$1', [id]);
      return go(origin, '/manager/dashboard', { tab: 'reviews', success: 'Review deleted.' });
    }
    return go(origin, '/manager/dashboard', { tab: 'reviews', error: 'Review not found.' });
  }

  return go(origin, '/manager/dashboard');
}
