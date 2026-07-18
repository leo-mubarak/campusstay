// Manager registration — ported from manager-register.php
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getManager } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

export default async function ManagerRegisterPage({ searchParams }) {
  const sp = await searchParams;
  if (await getManager()) redirect('/manager/dashboard');

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏠</div>
          <h2>Create Manager Account</h2>
          <p>List your hostel and start receiving student enquiries</p>
        </div>
        <Alerts success={sp.success} error={sp.error} />
        <form method="POST" action="/api/auth">
          <input type="hidden" name="action" value="register" />
          <div className="form-group">
            <label>Full Name <span className="req">*</span></label>
            <input type="text" name="full_name" className="form-control" required placeholder="e.g. Kwame Asante" autoComplete="name" />
          </div>
          <div className="form-group">
            <label>Email Address <span className="req">*</span></label>
            <input type="email" name="email" className="form-control" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Hostel / Property Name <span className="req">*</span></label>
            <input type="text" name="hostel_name" className="form-control" required placeholder="e.g. Sunrise Hostel" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" className="form-control" placeholder="0XX XXX XXXX" autoComplete="tel" />
          </div>
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input type="tel" name="whatsapp" className="form-control" placeholder="0XX XXX XXXX (if different from phone)" />
            <div className="form-hint">Students can contact you directly via WhatsApp from your listings.</div>
          </div>
          <div className="form-group">
            <label>Password <span className="req">*</span></label>
            <input type="password" name="password" className="form-control" required placeholder="Min. 6 characters" minLength={6} autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label>Confirm Password <span className="req">*</span></label>
            <input type="password" name="confirm" className="form-control" required placeholder="Repeat your password" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            Create Account &amp; Go to Dashboard
          </button>
        </form>
        <div className="auth-divider" style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link href="/manager/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
