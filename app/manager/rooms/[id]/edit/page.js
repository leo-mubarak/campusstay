// Edit room — ported from room-form.php (edit mode, ownership verified)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, q1 } from '@/lib/db';
import { getManager } from '@/lib/auth';
import Alerts from '@/components/Alerts';
import RoomForm from '../../RoomForm';

export const dynamic = 'force-dynamic';

export default async function EditRoomPage({ params, searchParams }) {
  const manager = await getManager();
  if (!manager) redirect('/manager/login');
  const { id } = await params;
  const sp = await searchParams;

  const room = await q1('SELECT * FROM rooms WHERE id = $1 AND manager_id = $2', [parseInt(id, 10) || 0, manager.id]);
  if (!room) redirect('/manager/dashboard');

  const mediaItems = await q('SELECT * FROM media WHERE room_id = $1 ORDER BY sort_order ASC', [room.id]);
  const universities = await q('SELECT * FROM universities ORDER BY name');
  // The hostel name saved on the manager's account (used to auto-fill the form).
  const me = await q1('SELECT hostel_name FROM managers WHERE id = $1', [manager.id]);
  const accountHostelName = (me && me.hostel_name) || '';

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="breadcrumb"><Link href="/manager/dashboard">← Back to Dashboard</Link></div>
        <h2>Edit Listing</h2>
        <p style={{ marginBottom: 28 }}>Update details for {room.hostel_name} — {room.room_identifier}</p>
        <Alerts success={sp.success} error={sp.error} />
        <RoomForm
          room={JSON.parse(JSON.stringify(room))}
          mediaItems={JSON.parse(JSON.stringify(mediaItems))}
          universities={universities}
          accountHostelName={accountHostelName}
          uploadsEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
        />
      </div>
    </div>
  );
}
