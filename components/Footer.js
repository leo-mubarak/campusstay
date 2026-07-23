// Footer — ported from views/layouts/footer.php
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="CampusStay logo" className="brand-logo-img" />
          Campus<span className="brand-accent">Stay</span>
          <p>The smartest way to find student accommodation near your campus.</p>
        </div>
        <div className="footer-links">
          <div>
            <h5>Platform</h5>
            <Link href="/">Home</Link>
            <Link href="/browse">Browse Rooms</Link>
            <Link href="/watchlist">My Watchlist</Link>
          </div>
          <div>
            <h5>Managers</h5>
            <Link href="/manager/register">Create Account</Link>
            <Link href="/manager/login">Manager Login</Link>
            <Link href="/manager/dashboard">Dashboard</Link>
            <Link href="/manager/rooms/new">Add Listing</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} <strong>CampusStay</strong> — Campus Hostel Finder Platform</p>
      </div>
    </footer>
  );
}
