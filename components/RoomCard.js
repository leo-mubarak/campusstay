'use client';
// Room card — ported from views/components/room_card.php
import Link from 'next/link';
import Stars from './Stars';
import Icon from './Icon';
import WatchlistButton from './WatchlistButton';
import { amenityList, genderBadge, n0, n1 } from '@/lib/utils';

export default function RoomCard({ room, inWatchlist, priceMode = 'annual', onEnquire, onRemoved, faded }) {
  const amenities = amenityList(room.amenities).slice(0, 3);
  const g = genderBadge(room.gender_spec);
  const avg = Number(room.avg_rating || 0);
  const available = room.availability === 'Available';

  return (
    <div className={`card room-card ${faded && !available ? 'room-card-faded' : ''}`}>
      <div className="room-card-img">
        {/* The image itself is clickable and opens the room page (full gallery) */}
        <Link href={`/rooms/${room.id}`} className="room-card-img-link" aria-label={`View ${room.hostel_name}`}>
          {room.thumb ? (
            <img src={room.thumb} alt={room.hostel_name} loading="lazy" />
          ) : (
            <div className="room-card-placeholder"><Icon name="home" size={44} color="var(--primary)" /></div>
          )}
        </Link>
        <div className="room-card-overlay-top">
          <span className={`badge ${g.cls}`}>{g.icon} {room.gender_spec}</span>
          <span className={`badge ${available ? 'badge-avail' : 'badge-full'}`}>{room.availability}</span>
        </div>
        <WatchlistButton roomId={room.id} initial={inWatchlist} onRemoved={onRemoved} />
      </div>
      <div className="room-card-body">
        {room.university_name && (
          <div className="room-uni-tag"><Icon name="school" size={12} /> {room.uni_short || room.university_name}</div>
        )}
        <div className="room-card-title">{room.hostel_name}</div>
        <div className="room-card-sub">{room.room_identifier} · {room.manager_name}</div>
        <div className="room-card-meta">
          <span><Icon name="box" size={12} /> {room.room_type}</span>
          <span><Icon name="pin" size={12} /> {n1(room.distance_km)}km · {room.walk_minutes}min</span>
        </div>
        {avg > 0 && (
          <div className="room-rating">
            <Stars rating={avg} />
            <span className="rating-num">{n1(avg)}</span>
            <span className="rating-count">({room.review_count})</span>
          </div>
        )}
        {amenities.length > 0 && (
          <div className="room-amenities">
            {amenities.map(a => <span key={a} className="amenity-chip">{a}</span>)}
          </div>
        )}
        <div className="room-card-footer">
          <div className="room-price-block">
            <div className="room-price">
              GHS {priceMode === 'semester' ? n0(room.semester_price) : n0(room.annual_price)}
              <small>{priceMode === 'semester' ? '/sem' : '/yr'}</small>
            </div>
          </div>
          <div className="room-card-actions">
            <Link href={`/rooms/${room.id}`} className="btn btn-outline btn-sm">View</Link>
            {available && onEnquire && (
              <button className="btn btn-primary btn-sm" onClick={() => onEnquire(room)}>Enquire</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
