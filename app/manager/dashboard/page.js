import Icon from '@/components/Icon';
import DeleteAccountForm from '@/components/DeleteAccountForm';
// Manager dashboard — ported from dashboard.php (overview / listings / enquiries / reviews / profile)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, q1 } from '@/lib/db';
import { getManager } from '@/lib/auth';
import { whatsAppLink, n0, n1, fmtDate, fmtDateTime } from '@/lib/utils';
import Stars from '@/components/Stars';
import Alerts from '@/components/Alerts';
import ConfirmLink from '@/components/ConfirmLink';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  const manager = await getManager();
  if (!manager) redirect('/manager/login');
  const sp = await searchParams;
  const tab = sp.tab || 'overview';
  const mid = manager.id;

  const stats = {
    total: (await q1('SELECT COUNT(*)::int AS c FROM rooms WHERE manager_id=$1', [mid]))?.c || 0,
    avail: (await q1(`SELECT COUNT(*)::int AS c FROM rooms WHERE manager_id=$1 AND availability='Available'`, [mid]))?.c || 0,
    full: (await q1(`SELECT COUNT(*)::int AS c FROM rooms WHERE manager_id=$1 AND availability='Fully Booked'`, [mid]))?.c || 0,
    unread: (await q1(`SELECT COUNT(*)::int AS c FROM enquiries e JOIN rooms r ON e.room_id=r.id WHERE r.manager_id=$1 AND e.status='unread'`, [mid]))?.c || 0,
    reviews: (await q1(`SELECT COUNT(*)::int AS c FROM reviews rv JOIN rooms r ON rv.room_id=r.id WHERE r.manager_id=$1 AND rv.status='approved'`, [mid]))?.c || 0,
  };

  const myRooms = await q(
    `SELECT r.*, u.short_name AS uni_short FROM rooms r
     LEFT JOIN universities u ON r.university_id = u.id
     WHERE r.manager_id = $1 ORDER BY r.created_at DESC`, [mid]
  );

  let enquiries = [], reviews = [], profile = null;
  if (tab === 'enquiries' || tab === 'overview') {
    enquiries = await q(
      `SELECT e.*, r.hostel_name, r.room_identifier FROM enquiries e
       JOIN rooms r ON e.room_id = r.id WHERE r.manager_id = $1 ORDER BY e.created_at DESC`, [mid]
    );
    if (tab === 'enquiries' && enquiries.some(e => e.status === 'unread')) {
      await q(
        `UPDATE enquiries SET status='read' WHERE status='unread'
         AND room_id IN (SELECT id FROM rooms WHERE manager_id = $1)`, [mid]
      );
    }
  }
  if (tab === 'reviews') {
    reviews = await q(
      `SELECT rv.*, r.hostel_name, r.room_identifier FROM reviews rv
       JOIN rooms r ON rv.room_id = r.id WHERE r.manager_id = $1 ORDER BY rv.created_at DESC`, [mid]
    );
  }
  if (tab === 'profile') {
    profile = await q1('SELECT * FROM managers WHERE id = $1', [mid]);
  }

  const roomRow = (r, compact) => (
    <tr key={r.id}>
      <td><strong>{r.hostel_name}</strong></td>
      <td>{r.room_identifier}</td>
      <td>{r.uni_short || '—'}</td>
      <td>{r.room_type}</td>
      {!compact && <td>{r.gender_spec}</td>}
      <td>GHS {n0(r.annual_price)}</td>
      {!compact && <td>GHS {n0(r.semester_price)}</td>}
      {!compact && <td>{n1(r.distance_km)}km</td>}
      <td><span className={`badge ${r.availability === 'Available' ? 'badge-avail' : 'badge-full'}`}>{r.availability}</span></td>
      <td className="action-cell">
        <Link href={`/rooms/${r.id}`} className="btn btn-outline btn-sm" target="_blank">View</Link>
        <Link href={`/manager/rooms/${r.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
        <ConfirmLink href={`/api/rooms?action=delete&id=${r.id}`} className="btn btn-danger btn-sm"
          confirm={`Delete '${r.hostel_name}'? This cannot be undone.`}>Del</ConfirmLink>
      </td>
    </tr>
  );

  return (
    <div className="section" style={{ paddingTop: 32 }}>
      <div className="container">
        <Alerts success={sp.success} error={sp.error} />
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-avatar">{manager.name?.[0]?.toUpperCase()}</div>
              <h4>{manager.name}</h4>
              <p>Hostel Manager</p>
            </div>
            <nav className="sidebar-nav">
              <Link href="/manager/dashboard?tab=overview" className={tab === 'overview' ? 'active' : ''}><span><Icon name="chart" size={14} /></span> Overview</Link>
              <Link href="/manager/dashboard?tab=listings" className={tab === 'listings' ? 'active' : ''}><span><Icon name="home" size={14} /></span> My Listings</Link>
              <Link href="/manager/rooms/new"><span>+</span> Add New Room</Link>
              <Link href="/manager/dashboard?tab=enquiries" className={tab === 'enquiries' ? 'active' : ''}>
                <span><Icon name="chat" size={14} /></span> Enquiries
                {stats.unread > 0 && <span className="nav-badge">{stats.unread}</span>}
              </Link>
              <Link href="/manager/dashboard?tab=reviews" className={tab === 'reviews' ? 'active' : ''}><span><Icon name="star" size={14} /></span> Reviews</Link>
              <Link href="/manager/dashboard?tab=profile" className={tab === 'profile' ? 'active' : ''}><span><Icon name="gear" size={14} /></span> Profile</Link>
            </nav>
            <div className="sidebar-logout">
              <a href="/api/auth?action=logout" className="btn btn-outline btn-full btn-sm">Logout</a>
            </div>
          </aside>

          <main className="dashboard-main">
            {tab === 'overview' && (
              <>
                <div className="dash-topbar">
                  <h2>Dashboard Overview</h2>
                  <Link href="/manager/rooms/new" className="btn btn-primary">+ Add New Room</Link>
                </div>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-label">Total Listings <span><Icon name="home" size={14} /></span></div><div className="stat-value">{stats.total}</div></div>
                  <div className="stat-card"><div className="stat-label">Available <span><Icon name="check" size={14} /></span></div><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.avail}</div></div>
                  <div className="stat-card"><div className="stat-label">Fully Booked <span><Icon name="close" size={14} /></span></div><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.full}</div></div>
                  <div className="stat-card"><div className="stat-label">Unread Enquiries <span><Icon name="chat" size={14} /></span></div><div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.unread}</div></div>
                  <div className="stat-card"><div className="stat-label">Reviews <span><Icon name="star" size={14} /></span></div><div className="stat-value">{stats.reviews}</div></div>
                </div>
                <h3 style={{ marginBottom: 14 }}>Recent Listings</h3>
                {myRooms.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Icon name="home" size={40} color="var(--primary)" /></div><h3>No listings yet</h3>
                    <Link href="/manager/rooms/new" className="btn btn-primary" style={{ marginTop: 14 }}>Add Your First Room</Link>
                  </div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Hostel</th><th>Room</th><th>Uni</th><th>Type</th><th>Annual</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{myRooms.slice(0, 5).map(r => roomRow(r, true))}</tbody>
                      </table>
                    </div>
                    {myRooms.length > 5 && (
                      <Link href="/manager/dashboard?tab=listings" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                        View all {myRooms.length} listings
                      </Link>
                    )}
                  </>
                )}
              </>
            )}

            {tab === 'listings' && (
              <>
                <div className="dash-topbar">
                  <h2>My Listings ({myRooms.length})</h2>
                  <Link href="/manager/rooms/new" className="btn btn-primary">+ Add New Room</Link>
                </div>
                {myRooms.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Icon name="home" size={40} color="var(--primary)" /></div><h3>No listings yet</h3>
                    <Link href="/manager/rooms/new" className="btn btn-primary" style={{ marginTop: 14 }}>Add Your First Room</Link>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Hostel</th><th>Room</th><th>Uni</th><th>Type</th><th>Gender</th><th>Annual</th><th>Sem</th><th>Dist</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>{myRooms.map(r => roomRow(r, false))}</tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'enquiries' && (
              <>
                <h2 style={{ marginBottom: 20 }}>Student Enquiries ({enquiries.length})</h2>
                {enquiries.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><Icon name="chat" size={40} color="var(--primary)" /></div><h3>No enquiries yet</h3></div>
                ) : (
                  <div className="enquiry-list">
                    {enquiries.map(e => (
                      <div className="card card-body enquiry-card" key={e.id}>
                        <div className="enquiry-head">
                          <div className="enquiry-author">
                            <div className="review-avatar">{e.student_name?.[0]?.toUpperCase()}</div>
                            <div>
                              <strong>{e.student_name}</strong>
                              <div className="enquiry-meta">
                                {e.student_email}
                                {e.student_phone && <> · {e.student_phone}</>}
                                {e.student_whatsapp && (
                                  <> · <a href={whatsAppLink(e.student_whatsapp, `Hi ${e.student_name}, regarding your enquiry about ${e.hostel_name}...`)}
                                    target="_blank" rel="noopener noreferrer" className="wa-inline-link">WhatsApp Student</a></>
                                )}
                              </div>
                              {(e.student_course || e.student_level) && (
                                <div className="enquiry-meta">
                                  {e.student_course ? e.student_course : ''}{e.student_level ? ` · ${e.student_level}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${e.status === 'unread' ? 'badge-unread' : 'badge-read'}`}>{e.status}</span>
                            <div className="text-xs text-muted" style={{ marginTop: 4 }}>{fmtDateTime(e.created_at)}</div>
                          </div>
                        </div>
                        <div className="enquiry-room">Re: {e.hostel_name} — {e.room_identifier}</div>
                        <p className="enquiry-message" style={{ whiteSpace: 'pre-line' }}>{e.message}</p>
                        <div className="enquiry-actions">
                          <a href={`mailto:${e.student_email}?subject=Re: Your enquiry about ${encodeURIComponent(e.hostel_name)}`}
                            className="btn btn-outline btn-sm">Reply via Email</a>
                          {e.student_phone && (
                            <a href={whatsAppLink(e.student_phone, `Hi ${e.student_name}, regarding your enquiry about ${e.hostel_name} — ${e.room_identifier}.`)}
                              target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm"> WhatsApp</a>
                          )}
                          <ConfirmLink href={`/api/rooms?action=delete-enquiry&id=${e.id}`} confirm="Delete this enquiry?" className="btn btn-danger btn-sm">
                            Delete
                          </ConfirmLink>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'reviews' && (
              <>
                <h2 style={{ marginBottom: 20 }}>Student Reviews ({reviews.length})</h2>
                {reviews.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><Icon name="star" size={40} color="var(--accent)" /></div><h3>No reviews yet</h3></div>
                ) : (
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
                            <span className={`badge ${rv.status === 'approved' ? 'badge-avail' : 'badge-full'}`}>{rv.status}</span>
                            <div className="text-xs text-muted" style={{ marginTop: 4 }}>{fmtDate(rv.created_at)}</div>
                          </div>
                        </div>
                        <div className="enquiry-room">Re: {rv.hostel_name} — {rv.room_identifier}</div>
                        {rv.comment && <p className="enquiry-message" style={{ whiteSpace: 'pre-line' }}>{rv.comment}</p>}
                        <div className="enquiry-actions">
                          <ConfirmLink href={`/api/rooms?action=delete-review&id=${rv.id}`} confirm="Delete this review?" className="btn btn-danger btn-sm">
                            Delete
                          </ConfirmLink>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'profile' && profile && (
              <>
                <h2 style={{ marginBottom: 20 }}>Profile Settings</h2>
                <div className="card card-body" style={{ maxWidth: 560 }}>
                  <form method="POST" action="/api/auth">
                    <input type="hidden" name="action" value="update_profile" />
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" name="full_name" className="form-control" defaultValue={profile.full_name} required />
                    </div>
                    <div className="form-group">
                      <label>Hostel / Property Name</label>
                      <input type="text" name="hostel_name" className="form-control"
                        defaultValue={profile.hostel_name || ''} placeholder="e.g. Sunrise Hostel" />
                      <div className="form-hint">This name is auto-filled on every room listing you create.</div>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" className="form-control" defaultValue={profile.phone || ''} placeholder="0XX XXX XXXX" />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp Number</label>
                      <input type="tel" name="whatsapp" className="form-control" defaultValue={profile.whatsapp || ''} placeholder="0XX XXX XXXX" />
                      <div className="form-hint">Students can contact you directly via WhatsApp from your listings.</div>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                  </form>

                  <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />
                  <h3 style={{ marginBottom: 16 }}>Change Password</h3>
                  <form method="POST" action="/api/auth">
                    <input type="hidden" name="action" value="change_password" />
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" name="current_password" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" name="new_password" className="form-control" required minLength={6} />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input type="password" name="confirm_password" className="form-control" required />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                  </form>

                  <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />
                  {/* Danger Zone: permanently delete this manager account */}
                  <DeleteAccountForm />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
