// Manager login — ported from manager-login.php
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getManager } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

export default async function ManagerLoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await getManager()) redirect('/manager/dashboard');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="CampusStay logo" style={{ width: 60, height: 60, marginBottom: 8 }} />
          <h2>Manager Login</h2>
          <p>Access your hostel management dashboard</p>
        </div>
        <Alerts success={sp.success} error={sp.error} />
        <form method="POST" action="/api/auth">
          <input type="hidden" name="action" value="login" />
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="form-control" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-control" required placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>Login to Dashboard</button>
        </form>
        <div className="auth-divider" style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-3)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/manager/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one free</Link>
        </div>
      </div>
    </div>
  );
}
