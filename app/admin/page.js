// Admin panel — recreated from the README description (original admin/dashboard.php
// was not included in the upload). Tabs: managers, universities, rooms, reviews.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, q1 } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { n0, fmtDate } from '@/lib/utils';
import Stars from '@/components/Stars';
import Alerts from '@/components/Alerts';
import ConfirmLink from '@/components/ConfirmLink';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');
  const sp = await searchParams;
  const tab = sp.tab || 'managers';

  const counts = {
    managers: (await q1('SELECT COUNT(*)::int AS c FROM managers'))?.c || 0,
    universities: (await q1('SELECT COUNT(*)::int AS c FROM universities'))?.c || 0,
    rooms: (await q1('SELECT COUNT(*)::int AS c FROM rooms'))?.c || 0,
    reviews: (await q1('SELECT COUNT(*)::int AS c FROM reviews'))?.c || 0,
  };

  let managers = [], universities = [], rooms = [], reviews = [];
  if (tab === 'managers')
    managers = await q(`SELECT m.*, (SELECT COUNT(*)::int FROM rooms WHERE manager_id = m.id) AS room_count
                        FROM managers m ORDER BY m.created_at DESC`);
  if (tab === 'universities')
    universities = await q(`SELECT u.*, (SELECT COUNT(*)::int FROM rooms WHERE university_id = u.id) AS room_count
                            FROM universities u ORDER BY u.name`);
  if (tab === 'rooms')
    rooms = await q(`SELECT r.*, m.full_name AS manager_name, u.short_name AS uni_short
                     FROM rooms r JOIN managers m ON r.manager_id = m.id
                     LEFT JOIN universities u ON r.university_id = u.id ORDER BY r.created_at DESC`);
  if (tab === 'reviews')
    reviews = await q(`SELECT rv.*, r.hostel_name, r.room_identifier
                       FROM reviews rv JOIN rooms r ON rv.room_id = r.id ORDER BY rv.created_at DESC`);

  const TabLink = ({ id, icon, label, count }) => (
    <Link href={`/admin?tab=${id}`} className={tab === id ? 'active' : ''}>
      <span>{icon}</span> {label} <span className="nav-badge" style={{ background: 'var(--text-3)' }}>{count}</span>
    </Link>
  );

  return (
    <div className="section" style={{ paddingTop: 32 }}>
      <div className="container">
        <Alerts success={sp.success} error={sp.error} />
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-avatar">🔐</div>
              <h4>Administrator</h4>
              <p>Platform Admin</p>
            </div>
            <nav className="sidebar-nav">
              <TabLink id="managers" icon="👤" label="Managers" count={counts.managers} />
              <TabLink id="universities" icon="🎓" label="Universities" count={counts.universities} />
              <TabLink id="rooms" icon="🏠" label="Rooms" count={counts.rooms} />
              <TabLink id="reviews" icon="⭐" label="Reviews" count={counts.reviews} />
            </nav>
            <div className="sidebar-logout">
              <a href="/api/admin?action=logout" className="btn btn-outline btn-full btn-sm">Logout</a>
            </div>
          </aside>

          <main className="dashboard-main">
            {tab === 'managers' && (
              <>
                <h2 style={{ marginBottom: 20 }}>Hostel Managers ({managers.length})</h2>
                <div className="card card-body" style={{ marginBottom: 20, maxWidth: 560 }}>
                  <h3 style={{ marginBottom: 14 }}>Create Manager Account</h3>
                  <form method="POST" action="/api/admin">
                    <input type="hidden" name="action" value="create_manager" />
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" name="full_name" className="form-control" required />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" className="form-control" required />
                      </div>
                      <div className="form-group">
                        <label>Hostel Name</label>
                        <input type="text" name="hostel_name" className="form-control" required />
                      </div>
                      <div className="form-group">
                        <label>Temp Password</label>
                        <input type="text" name="password" className="form-control" required minLength={6} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Create Manager</button>
                  </form>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Hostel</th><th>Phone</th><th>Rooms</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {managers.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.full_name}</strong></td>
                          <td>{m.email}</td>
                          <td>{m.hostel_name || '—'}</td>
                          <td>{m.phone || '—'}</td>
                          <td>{m.room_count}</td>
                          <td>{fmtDate(m.created_at)}</td>
                          <td className="action-cell">
                            <ConfirmLink href={`/api/admin?action=delete_manager&id=${m.id}`}
                              confirm={`Delete ${m.full_name} and ALL their rooms? This cannot be undone.`}
                              className="btn btn-danger btn-sm">Delete</ConfirmLink>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'universities' && (
              <>
                <h2 style={{ marginBottom: 20 }}>Universities ({universities.length})</h2>
                <div className="card card-body" style={{ marginBottom: 20, maxWidth: 560 }}>
                  <h3 style={{ marginBottom: 14 }}>Add University</h3>
                  <form method="POST" action="/api/admin">
                    <input type="hidden" name="action" value="add_university" />
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" className="form-control" required placeholder="University of Ghana" />
                      </div>
                      <div className="form-group">
                        <label>Short Name</label>
                        <input type="text" name="short_name" className="form-control" placeholder="UG" />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label>Location</label>
                        <input type="text" name="location" className="form-control" placeholder="Legon, Accra" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Add University</button>
                  </form>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Short</th><th>Location</th><th>Rooms</th><th>Actions</th></tr></thead>
                    <tbody>
                      {universities.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.short_name || '—'}</td>
                          <td>{u.location || '—'}</td>
                          <td>{u.room_count}</td>
                          <td className="action-cell">
                            <ConfirmLink href={`/api/admin?action=delete_university&id=${u.id}`}
                              confirm={`Delete ${u.name}? Rooms will be unlinked from it.`}
                              className="btn btn-danger btn-sm">Delete</ConfirmLink>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'rooms' && (
              <>
                <h2 style={{ marginBottom: 20 }}>All Rooms ({rooms.length})</h2>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Hostel</th><th>Room</th><th>Manager</th><th>Uni</th><th>Type</th><th>Annual</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {rooms.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.hostel_name}</strong></td>
                          <td>{r.room_identifier}</td>
                          <td>{r.manager_name}</td>
                          <td>{r.uni_short || '—'}</td>
                          <td>{r.room_type}</td>
                          <td>GHS {n0(r.annual_price)}</td>
                          <td><span className={`badge ${r.availability === 'Available' ? 'badge-avail' : 'badge-full'}`}>{r.availability}</span></td>
                          <td className="action-cell">
                            <Link href={`/rooms/${r.id}`} target="_blank" className="btn btn-outline btn-sm">View</Link>
                            <ConfirmLink href={`/api/admin?action=delete_room&id=${r.id}`}
                              confirm={`Delete '${r.hostel_name} — ${r.room_identifier}'?`}
                              className="btn btn-danger btn-sm">Del</ConfirmLink>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'reviews' && (
              <>
                <h2 style={{ marginBottom: 20 }}>All Reviews ({reviews.length})</h2>
                <div className="enquiry-list">
                  {reviews.map(rv => (
                    <div className="card card-body enquiry-card" key={rv.id}>
                      <div className="enquiry-head">
                        <div className="enquiry-author">
                          <div className="review-avatar">{rv.reviewer_name?.[0]?.toUpperCase()}</div>
                          <div>
                            <strong>{rv.reviewer_name}</strong>
                            <div className="enquiry-meta">{rv.reviewer_email}</div>
                            <div className="review-stars" style={{ marginTop: 4 }}><Stars rating={rv.rating} /></div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${rv.status === 'approved' ? 'badge-avail' : rv.status === 'pending' ? 'badge-unread' : 'badge-full'}`}>{rv.status}</span>
                          <div className="text-xs text-muted" style={{ marginTop: 4 }}>{fmtDate(rv.created_at)}</div>
                        </div>
                      </div>
                      <div className="enquiry-room">Re: {rv.hostel_name} — {rv.room_identifier}</div>
                      {rv.comment && <p className="enquiry-message" style={{ whiteSpace: 'pre-line' }}>{rv.comment}</p>}
                      <div className="enquiry-actions">
                        {rv.status !== 'approved' && (
                          <a href={`/api/admin?action=approve_review&id=${rv.id}`} className="btn btn-outline btn-sm">✓ Approve</a>
                        )}
                        {rv.status !== 'rejected' && (
                          <a href={`/api/admin?action=reject_review&id=${rv.id}`} className="btn btn-outline btn-sm">✕ Reject</a>
                        )}
                        <ConfirmLink href={`/api/admin?action=delete_review&id=${rv.id}`}
                          confirm="Delete this review permanently?" className="btn btn-danger btn-sm">Delete</ConfirmLink>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
