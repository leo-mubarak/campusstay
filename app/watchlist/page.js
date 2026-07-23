import Icon from '@/components/Icon';
// Watchlist page — ported from watchlist.php
import Link from 'next/link';
import { q } from '@/lib/db';
import { getWatchlistToken } from '@/lib/auth';
import { ROOM_SELECT } from '@/lib/db';
import RoomGrid from '@/components/RoomGrid';
import ConfirmLink from '@/components/ConfirmLink';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const token = await getWatchlistToken();
  let rooms = [], notifications = [];

  if (token) {
    rooms = await q(
      `SELECT sub.*, w.added_at FROM watchlist w
       JOIN (${ROOM_SELECT}) sub ON w.room_id = sub.id
       WHERE w.session_token = $1
       ORDER BY w.added_at DESC`, [token]
    );
    notifications = await q(
      `SELECT n.*, r.hostel_name, r.room_identifier
       FROM watchlist_notifications n
       JOIN rooms r ON n.room_id = r.id
       WHERE n.session_token = $1 AND n.is_read = FALSE
       ORDER BY n.created_at DESC`, [token]
    );
    if (notifications.length) {
      await q('UPDATE watchlist_notifications SET is_read = TRUE WHERE session_token = $1', [token]);
    }
  }

  const bookedCount = rooms.filter(r => r.availability !== 'Available').length;

  return (
    <div className="section">
      <div className="container">
        {notifications.length > 0 && (
          <div className="notif-banner">
            <div className="notif-banner-icon"><Icon name="bell" size={22} color="var(--accent)" /></div>
            <div>
              <strong>Watchlist Alerts</strong>
              <div className="notif-list">
                {notifications.map(n => (
                  <div className="notif-item" key={n.id}>
                    <span>{n.message}</span>
                    <Link href={`/rooms/${n.room_id}`} className="btn btn-outline btn-sm" style={{ marginLeft: 10 }}>View Room</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="section-head">
          <div>
            <h2><Icon name="heart" size={22} color="var(--danger)" /> My Watchlist</h2>
            <p>{rooms.length} saved room{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          {rooms.length > 0 && (
            <ConfirmLink href="/api/watchlist?action=clear" confirm="Clear your entire watchlist?" className="btn btn-outline btn-sm">
              Clear All
            </ConfirmLink>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-icon"><Icon name="heart" size={40} color="var(--text-3)" /></div>
            <h3>Your watchlist is empty</h3>
            <p>Browse rooms and click the heart icon to save them here for later.</p>
            <Link href="/browse" className="btn btn-primary" style={{ marginTop: 20 }}>Browse Rooms</Link>
          </div>
        ) : (
          <>
            {bookedCount > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                <strong>{bookedCount} room{bookedCount > 1 ? 's' : ''}</strong> in your watchlist{' '}
                {bookedCount > 1 ? 'are' : 'is'} now fully booked. Consider looking for alternatives.
              </div>
            )}
            <RoomGrid rooms={rooms} watchlistIds={rooms.map(r => r.id)} removeOnUnsave />
          </>
        )}
      </div>
    </div>
  );
}
