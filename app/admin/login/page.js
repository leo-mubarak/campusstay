// Admin login — ported from admin/login.php
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await isAdmin()) redirect('/admin');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="CampusStay logo" style={{ width: 60, height: 60, marginBottom: 8 }} />
          <h2>Admin Login</h2>
          <p>CampusStay Administration Panel</p>
        </div>
        <Alerts success={sp.success} error={sp.error} />
        <form method="POST" action="/api/admin">
          <input type="hidden" name="action" value="login" />
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" className="form-control" required placeholder="admin" autoComplete="username" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-control" required placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Login to Admin Panel</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link href="/">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
