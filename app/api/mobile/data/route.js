// app/api/mobile/data/route.js
// ADD THIS FILE to your campusstay GitHub repo at the path shown above.
// Public JSON data for the mobile app.
//
// GET  ?type=rooms&...filters      -> { success, rooms }
// GET  ?type=room&id=3             -> { success, room, media, reviews }
// GET  ?type=universities          -> { success, universities }
// GET  ?type=stats                 -> { success, stats }
// GET  ?type=watchlist&token=...   -> { success, ids }
// POST { action:'toggle'|'clear', token, room_id } -> watchlist changes

import { NextResponse } from 'next/server';
import { q, q1, ROOM_SELECT } from '@/lib/db';

const ok = (data) => NextResponse.json({ success: true, ...data });
const fail = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const type = p.get('type');

  try {
    // ---- rooms list with filters ----
    if (type === 'rooms') {
      let sql = `${ROOM_SELECT} WHERE 1=1`;
      const params = [];
      const add = (v) => { params.push(v); return `$${params.length}`; };

      if (p.get('room_type')) sql += ` AND r.room_type = ${add(p.get('room_type'))}`;
      if (p.get('gender_spec')) sql += ` AND r.gender_spec = ${add(p.get('gender_spec'))}`;
      if (Number(p.get('university_id'))) sql += ` AND r.university_id = ${add(Number(p.get('university_id')))}`;

      const maxPrice = Number(p.get('max_price')) || 0;
      if (maxPrice > 0) {
        const col = p.get('price_mode') === 'semester' ? 'r.semester_price' : 'r.annual_price';
        sql += ` AND ${col} <= ${add(maxPrice)}`;
      }
      const maxDist = Number(p.get('max_dist')) || 0;
      if (maxDist > 0) sql += ` AND r.distance_km <= ${add(maxDist)}`;
      if (p.get('avail_only') === '1') sql += ` AND r.availability = 'Available'`;
      if (p.get('search')) {
        const term = add('%' + p.get('search') + '%');
        sql += ` AND (r.hostel_name ILIKE ${term} OR r.room_identifier ILIKE ${term})`;
      }

      sql += {
        price_asc: ' ORDER BY r.annual_price ASC',
        price_desc: ' ORDER BY r.annual_price DESC',
        closest: ' ORDER BY r.distance_km ASC',
        top_rated: ' ORDER BY avg_rating DESC NULLS LAST',
      }[p.get('sort')] || ' ORDER BY r.created_at DESC';

      return ok({ rooms: await q(sql, params) });
    }

    // ---- single room bundle ----
    if (type === 'room') {
      const id = Number(p.get('id')) || 0;
      const room = await q1(`${ROOM_SELECT} WHERE r.id = $1`, [id]);
      if (!room) return fail('Room not found', 404);
      const media = await q('SELECT * FROM media WHERE room_id = $1 ORDER BY sort_order', [id]);
      const reviews = await q(
        `SELECT * FROM reviews WHERE room_id = $1 AND status = 'approved' ORDER BY created_at DESC`,
        [id]
      );
      return ok({ room, media, reviews });
    }

    // ---- universities ----
    if (type === 'universities') {
      return ok({ universities: await q('SELECT * FROM universities ORDER BY name') });
    }

    // ---- stats ----
    if (type === 'stats') {
      const rooms = (await q1(`SELECT COUNT(*)::int c FROM rooms WHERE availability='Available'`))?.c || 0;
      const hostels = (await q1(`SELECT COUNT(DISTINCT manager_id)::int c FROM rooms`))?.c || 0;
      const universities = (await q1(`SELECT COUNT(*)::int c FROM universities`))?.c || 0;
      return ok({ stats: { rooms, hostels, universities } });
    }

    // ---- watchlist ids for a device token ----
    if (type === 'watchlist') {
      const token = p.get('token') || '';
      if (!token) return fail('Missing token');
      const rows = await q('SELECT room_id FROM watchlist WHERE session_token = $1', [token]);
      return ok({ ids: rows.map((row) => row.room_id) });
    }

    return fail('Unknown type');
  } catch (error) {
    console.error('mobile/data error:', error);
    return fail('Server error', 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = body.token || '';
    if (!token) return fail('Missing token');

    // ---- toggle one room ----
    if (body.action === 'toggle') {
      const roomId = Number(body.room_id) || 0;
      if (!(await q1('SELECT id FROM rooms WHERE id = $1', [roomId]))) {
        return fail('Room not found');
      }
      const existing = await q1(
        'SELECT id FROM watchlist WHERE session_token = $1 AND room_id = $2',
        [token, roomId]
      );
      if (existing) {
        await q('DELETE FROM watchlist WHERE id = $1', [existing.id]);
        return ok({ action: 'removed' });
      }
      await q('INSERT INTO watchlist (session_token, room_id) VALUES ($1, $2)', [token, roomId]);
      return ok({ action: 'added' });
    }

    // ---- clear entire watchlist ----
    if (body.action === 'clear') {
      await q('DELETE FROM watchlist WHERE session_token = $1', [token]);
      return ok({});
    }

    return fail('Unknown action');
  } catch (error) {
    console.error('mobile/data POST error:', error);
    return fail('Server error', 500);
  }
}
