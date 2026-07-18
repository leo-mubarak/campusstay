// Browse page with filters — ported from browse.php
import Link from 'next/link';
import { q, q1, ROOM_SELECT } from '@/lib/db';
import { getWatchlistToken } from '@/lib/auth';
import { VALID_TYPES, VALID_GENDERS, n0 } from '@/lib/utils';
import RoomGrid from '@/components/RoomGrid';
import Alerts from '@/components/Alerts';
import FilterForm from './FilterForm';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }) {
  const sp = await searchParams;
  let roomType = sp.room_type || '';
  let genderSpec = sp.gender_spec || '';
  const universityId = parseInt(sp.university_id || 0, 10) || 0;
  const maxPrice = parseFloat(sp.max_price || 0) || 0;
  const maxDist = parseFloat(sp.max_dist || 0) || 0;
  const availOnly = sp.avail_only === undefined ? true : sp.avail_only === '1';
  const priceMode = sp.price_mode === 'semester' ? 'semester' : 'annual';
  const sort = sp.sort || 'newest';

  if (!VALID_TYPES.includes(roomType)) roomType = '';
  if (!VALID_GENDERS.includes(genderSpec)) genderSpec = '';

  let sql = `${ROOM_SELECT} WHERE 1=1`;
  const params = [];
  const add = v => { params.push(v); return `$${params.length}`; };

  if (roomType) sql += ` AND r.room_type = ${add(roomType)}`;
  if (genderSpec) sql += ` AND r.gender_spec = ${add(genderSpec)}`;
  if (universityId) sql += ` AND r.university_id = ${add(universityId)}`;
  if (maxPrice > 0) {
    const col = priceMode === 'semester' ? 'r.semester_price' : 'r.annual_price';
    sql += ` AND ${col} <= ${add(maxPrice)}`;
  }
  if (maxDist > 0) sql += ` AND r.distance_km <= ${add(maxDist)}`;
  if (availOnly) sql += ` AND r.availability = 'Available'`;

  sql += {
    price_asc: ' ORDER BY r.annual_price ASC',
    price_desc: ' ORDER BY r.annual_price DESC',
    closest: ' ORDER BY r.distance_km ASC',
    top_rated: ' ORDER BY avg_rating DESC NULLS LAST',
  }[sort] || ' ORDER BY r.created_at DESC';

  const rooms = await q(sql, params);
  const maxDbPrice = Number((await q1('SELECT MAX(annual_price) AS m FROM rooms'))?.m || 10000);
  const universities = await q('SELECT * FROM universities ORDER BY name');
  const token = await getWatchlistToken();
  const watchlistIds = token
    ? (await q('SELECT room_id FROM watchlist WHERE session_token = $1', [token])).map(r => r.room_id)
    : [];

  return (
    <div className="section">
      <div className="container">
        <Alerts success={sp.success} error={sp.error} />
        <div className="browse-topbar">
          <div>
            <h2>Browse Rooms</h2>
            <p>{rooms.length} room{rooms.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
        <div className="browse-layout">
          <aside className="filter-sidebar">
            <div className="card card-body">
              <FilterForm
                universities={universities}
                values={{ roomType, genderSpec, universityId, maxPrice, maxDist, availOnly, priceMode, sort }}
                maxDbPrice={maxDbPrice + 500}
              />
            </div>
          </aside>
          <main>
            {rooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No rooms found</h3>
                <p>Try adjusting your filters to see more results.</p>
                <Link href="/browse" className="btn btn-outline" style={{ marginTop: 16 }}>Clear filters</Link>
              </div>
            ) : (
              <RoomGrid rooms={rooms} watchlistIds={watchlistIds} priceMode={priceMode} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
