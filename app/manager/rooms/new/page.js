// Add new room — ported from room-form.php (create mode)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getManager } from '@/lib/auth';
import Alerts from '@/components/Alerts';
import RoomForm from '../RoomForm';

export const dynamic = 'force-dynamic';

export default async function NewRoomPage({ searchParams }) {
  const manager = await getManager();
  if (!manager) redirect('/manager/login');
  const sp = await searchParams;
  const universities = await q('SELECT * FROM universities ORDER BY name');

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="breadcrumb"><Link href="/manager/dashboard">← Back to Dashboard</Link></div>
        <h2>Add New Room</h2>
        <p style={{ marginBottom: 28 }}>Fill in all details to publish your room listing.</p>
        <Alerts success={sp.success} error={sp.error} />
        <RoomForm universities={universities} uploadsEnabled={!!process.env.BLOB_READ_WRITE_TOKEN} />
      </div>
    </div>
  );
}
