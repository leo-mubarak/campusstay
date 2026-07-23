// Room detail page — ported from room.php
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, q1 } from '@/lib/db';
import { getWatchlistToken } from '@/lib/auth';
import { amenityList, genderBadge, whatsAppLink, n0, n1, fmtDate } from '@/lib/utils';
import Stars from '@/components/Stars';
import WatchlistButton from '@/components/WatchlistButton';
import Alerts from '@/components/Alerts';
import Gallery from './Gallery';
import Icon from '@/components/Icon';
import DetailActions, { ReviewButton } from './DetailActions';

export const dynamic = 'force-dynamic';

export default async function RoomPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const roomId = parseInt(id, 10);
  if (!roomId) redirect('/browse');

  const room = await q1(
    `SELECT r.*, m.full_name AS manager_name, m.phone AS manager_phone,
            m.email AS manager_email, m.whatsapp AS manager_whatsapp,
            u.name AS university_name, u.short_name AS uni_short
     FROM rooms r
     JOIN managers m ON r.manager_id = m.id
     LEFT JOIN universities u ON r.university_id = u.id
     WHERE r.id = $1`, [roomId]
  );
  if (!room) redirect('/browse');

  const media = await q('SELECT * FROM media WHERE room_id = $1 ORDER BY sort_order ASC', [roomId]);
  const reviews = await q(
    `SELECT * FROM reviews WHERE room_id = $1 AND status = 'approved' ORDER BY created_at DESC`, [roomId]
  );
  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length) * 10) / 10
    : 0;
  const amenities = amenityList(room.amenities);
  const g = genderBadge(room.gender_spec);

  const token = await getWatchlistToken();
  const inWatchlist = token
    ? !!(await q1('SELECT id FROM watchlist WHERE session_token = $1 AND room_id = $2', [token, roomId]))
    : false;

  const waLink = room.manager_whatsapp
    ? whatsAppLink(room.manager_whatsapp,
        `Hi, I found your listing on CampusStay: ${room.hostel_name} — ${room.room_identifier}. Is it still available?`)
    : '';
  const available = room.availability === 'Available';

  const details = [
    ['Room Type', room.room_type],
    ['Gender', room.gender_spec],
    ['Distance', `${n1(room.distance_km)} km from campus`],
    ['Walk Time', `${room.walk_minutes} minutes`],
    ['Annual Price', `GHS ${n0(room.annual_price)}`],
    ['Semester Price', `GHS ${n0(room.semester_price)}`],
    ['Availability', room.availability],
    ['Listed', fmtDate(room.created_at)],
  ];

  return (
    <div className="section">
      <div className="container">
        <Alerts success={sp.success} error={sp.error} />
        <div className="breadcrumb"><Link href="/browse">← Back to listings</Link></div>

        <div className="room-detail-grid">
          <div className="room-detail-main">
            {media.length > 0 ? <Gallery media={media} /> : <div className="room-no-photo"><Icon name="home" size={56} color="var(--primary)" /></div>}

            <div className="room-detail-header">
              <div>
                {room.university_name && (
                  <div className="room-uni-tag" style={{ marginBottom: 8 }}>
                    <Icon name="school" size={13} /> {room.uni_short || room.university_name} — {room.university_name}
                  </div>
                )}
                <h1 style={{ marginBottom: 4 }}>{room.hostel_name}</h1>
                <p>{room.room_identifier} · Listed by <strong>{room.manager_name}</strong></p>
              </div>
              <WatchlistButton roomId={roomId} initial={inWatchlist} variant="lg" />
            </div>

            <div className="badge-row">
              <span className={`badge ${g.cls}`}>{room.gender_spec}</span>
              <span className={`badge ${available ? 'badge-avail' : 'badge-full'}`}>{room.availability}</span>
              <span className="badge badge-type">{room.room_type}</span>
              {avg > 0 && <span className="badge badge-rating">Rated {n1(avg)} ({reviews.length} reviews)</span>}
            </div>

            {room.description && (
              <div className="card card-body detail-card">
                <h3>About this Room</h3>
                <p style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{room.description}</p>
              </div>
            )}

            <div className="card card-body detail-card">
              <h3>Room Details</h3>
              <div className="detail-grid">
                {details.map(([label, value]) => (
                  <div className="detail-item" key={label}>
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {amenities.length > 0 && (
              <div className="card card-body detail-card">
                <h3>Amenities</h3>
                <div className="amenities-full">
                  {amenities.map(a => <span key={a} className="amenity-chip-lg"><Icon name="check" size={12} /> {a}</span>)}
                </div>
              </div>
            )}

            <div className="card card-body detail-card" id="reviews-section">
              <div className="reviews-header">
                <div>
                  <h3>Student Reviews</h3>
                  {avg > 0 && (
                    <div className="avg-rating-display">
                      <span className="avg-num">{n1(avg)}</span>
                      <div>
                        <Stars rating={avg} />
                        <span className="rating-count"> {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
                <ReviewButton roomId={roomId} />
              </div>
              {reviews.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-icon"><Icon name="chat" size={40} color="var(--primary)" /></div>
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map(rev => (
                    <div className="review-item" key={rev.id}>
                      <div className="review-top">
                        <div className="review-author">
                          <div className="review-avatar">{rev.reviewer_name[0]?.toUpperCase()}</div>
                          <div>
                            <strong>{rev.reviewer_name}</strong>
                            <div className="review-date">{fmtDate(rev.created_at)}</div>
                          </div>
                        </div>
                        <div className="review-stars"><Stars rating={rev.rating} /></div>
                      </div>
                      {rev.comment && (
                        <p className="review-comment" style={{ whiteSpace: 'pre-line' }}>{rev.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="room-detail-sidebar">
            <div className="card card-body sticky-enquiry">
              <div className="price-display">
                <div className="price-main">GHS {n0(room.annual_price)}</div>
                <div className="price-sub">per year</div>
                <div className="price-alt">GHS {n0(room.semester_price)} <span>per semester</span></div>
              </div>
              <div className="sidebar-meta">
                <div><Icon name="pin" size={13} /> {n1(room.distance_km)} km · {room.walk_minutes} min walk</div>
                <div><Icon name="box" size={13} /> {room.room_type}</div>
                {room.university_name && <div><Icon name="school" size={13} /> {room.university_name}</div>}
              </div>

              {available ? (
                <DetailActions room={JSON.parse(JSON.stringify(room))} waLink={waLink} />
              ) : (
                <div className="alert alert-danger" style={{ marginTop: 0 }}>This room is currently fully booked.</div>
              )}

              <div className="manager-contact-card">
                <h4>Manager</h4>
                <div className="manager-info">
                  <div className="manager-avatar">{room.manager_name[0]?.toUpperCase()}</div>
                  <div>
                    <strong>{room.manager_name}</strong>
                    <div><Icon name="phone" size={13} /> {room.manager_phone || 'Not provided'}</div>
                    {room.manager_whatsapp && (
                      <a href={whatsAppLink(room.manager_whatsapp)} target="_blank" rel="noopener noreferrer" className="wa-inline-link">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <WatchlistButton roomId={roomId} initial={inWatchlist} variant="full" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
