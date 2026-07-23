// Homepage — ported from index.php
import Link from 'next/link';
import { q, q1, ROOM_SELECT } from '@/lib/db';
import { getManager, getWatchlistToken } from '@/lib/auth';
import RoomGrid from '@/components/RoomGrid';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

const HOW = [
  ['search', 'Search', 'Filter by university, room type, gender, price & distance.'],
  ['eye', 'Browse', 'View photos, videos and full details of each listing.'],
  ['chat', 'Enquire', 'Message the manager directly — or WhatsApp them instantly.'],
  ['home', 'Move In', 'Confirm your room and settle in on your terms.'],
];

export default async function HomePage() {
  const manager = await getManager();
  const token = await getWatchlistToken();

  const featured = await q(
    `${ROOM_SELECT} WHERE r.availability = 'Available' ORDER BY r.created_at DESC LIMIT 6`
  );
  const totalRooms = (await q1(`SELECT COUNT(*)::int AS c FROM rooms WHERE availability = 'Available'`))?.c || 0;
  const totalHostels = (await q1(`SELECT COUNT(DISTINCT manager_id)::int AS c FROM rooms`))?.c || 0;
  const universities = await q('SELECT * FROM universities ORDER BY name');
  const watchlistIds = token
    ? (await q('SELECT room_id FROM watchlist WHERE session_token = $1', [token])).map(r => r.room_id)
    : [];

  return (
    <>
      <section className="hero">
        <div className="hero-bg-pattern"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">Ghana&apos;s #1 Student Housing Platform</div>
            <h1>Find Your Perfect <span className="hero-highlight">Campus Room</span></h1>
            <p>Browse verified hostel listings near your university. Filter by price, room type, gender, and distance — all in one place.</p>

            <form action="/browse" method="GET" className="hero-search">
              <div className="hs-field">
                <span className="hs-icon"><Icon name="school" size={18} /></span>
                <select name="university_id" defaultValue="">
                  <option value="">All universities</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>
                  ))}
                </select>
              </div>
              <div className="hs-field">
                <span className="hs-icon"><Icon name="box" size={18} /></span>
                <select name="room_type" defaultValue="">
                  <option value="">All room types</option>
                  <option>Single</option><option>Two-in-one</option>
                  <option>Three-in-one</option><option>Four-in-one</option>
                </select>
              </div>
              <div className="hs-field">
                <span className="hs-icon"><Icon name="cash" size={18} /></span>
                <input type="number" name="max_price" placeholder="Max price (GHS)" min="0" step="100" />
              </div>
              <button type="submit" className="btn btn-primary hs-btn">Search Rooms</button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat"><strong>{totalRooms}</strong><span>Rooms Available</span></div>
              <div className="hero-stat-sep"></div>
              <div className="hero-stat"><strong>{totalHostels}</strong><span>Hostels Listed</span></div>
              <div className="hero-stat-sep"></div>
              <div className="hero-stat"><strong>{universities.length}</strong><span>Universities</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Featured Rooms</h2>
              <p>Recently listed and available now</p>
            </div>
            <Link href="/browse" className="btn btn-outline">View all rooms</Link>
          </div>
          {featured.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="home" size={40} color="var(--primary)" /></div>
              <h3>No rooms listed yet</h3>
              <p>Be the first hostel manager to list a room.</p>
            </div>
          ) : (
            <RoomGrid rooms={featured} watchlistIds={watchlistIds} />
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container text-center">
          <h2>How CampusStay Works</h2>
          <p className="section-sub">Simple steps to find or list a room</p>
          <div className="how-grid">
            {HOW.map(([icon, title, desc]) => (
              <div className="how-card" key={title}>
                <div className="how-icon"><Icon name={icon} size={24} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!manager && (
        <section className="section">
          <div className="container">
            <div className="cta-banner">
              <div>
                <h2>Are you a hostel manager?</h2>
                <p>List your rooms for free and start receiving student enquiries today.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/manager/register" className="btn btn-accent btn-lg">Create Free Account</Link>
                <Link href="/manager/login" className="btn btn-outline btn-lg"
                  style={{ background: 'rgba(255,255,255,.15)', borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
