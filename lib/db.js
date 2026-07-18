// lib/db.js — Postgres connection (works with Neon, Vercel Postgres, Supabase)
import { Pool } from 'pg';

let pool;
function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || '';
    pool = new Pool({
      connectionString: url,
      max: 3,
      ssl: url.includes('localhost') || url.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

// q('SELECT * FROM rooms WHERE id=$1', [id]) -> array of rows
export async function q(text, params = []) {
  const { rows } = await getPool().query(text, params);
  return rows;
}

// Convenience: first row or null
export async function q1(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}

// The big SELECT used by home / browse / watchlist (same as the old PHP query)
export const ROOM_SELECT = `
  SELECT r.*, m.full_name AS manager_name, m.phone AS manager_phone, m.whatsapp AS manager_whatsapp,
         u.name AS university_name, u.short_name AS uni_short,
         (SELECT file_path FROM media WHERE room_id = r.id AND media_type = 'photo' ORDER BY sort_order LIMIT 1) AS thumb,
         (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE room_id = r.id AND status = 'approved') AS avg_rating,
         (SELECT COUNT(*)::int FROM reviews WHERE room_id = r.id AND status = 'approved') AS review_count
  FROM rooms r
  JOIN managers m ON r.manager_id = m.id
  LEFT JOIN universities u ON r.university_id = u.id
`;
