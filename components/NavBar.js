'use client';
// Navbar — ported from views/layouts/header.php
import Link from 'next/link';
import Icon from './Icon';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavBar({ manager, wlCount, notifCount }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(wlCount);

  useEffect(() => {
    const onChange = e => setCount(c => Math.max(0, c + e.detail));
    window.addEventListener('wl-change', onChange);
    return () => window.removeEventListener('wl-change', onChange);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const active = href => (pathname === href ? 'active' : '');

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          <img src="/logo.png" alt="CampusStay logo" className="brand-logo-img" />
          Campus<span className="brand-accent">Stay</span>
        </Link>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          <Link href="/" className={active('/')}>Home</Link>
          <Link href="/browse" className={active('/browse')}>Browse Rooms</Link>
          <Link href="/watchlist" className={`nav-watchlist ${active('/watchlist')}`}>
            <span><Icon name="heart" size={13} /> Watchlist</span>
            {count > 0 && <span className="nav-badge">{count}</span>}
            {notifCount > 0 && (
              <span className="nav-badge notif-badge" title={`${notifCount} new notification${notifCount > 1 ? 's' : ''}`}><Icon name="bell" size={12} color="#fff" /></span>
            )}
          </Link>
          {manager ? (
            <>
              <Link href="/manager/dashboard" className={active('/manager/dashboard')}>Dashboard</Link>
              <a href="/api/auth?action=logout" className="btn-nav-outline">
                Logout <span style={{ opacity: 0.7 }}>({manager.name})</span>
              </a>
            </>
          ) : (
            <>
              <Link href="/manager/register" className="btn-nav-outline">Register</Link>
              <Link href="/manager/login" className="btn-nav">Manager Login</Link>
            </>
          )}
        </div>
        <button className="hamburger" aria-label="Menu" onClick={() => setOpen(o => !o)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
