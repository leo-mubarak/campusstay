// Server component: loads session + watchlist counts, renders the NavBar
import { getManager, getWatchlistToken } from '@/lib/auth';
import { q1 } from '@/lib/db';
import NavBar from './NavBar';

export default async function Header() {
  const manager = await getManager();
  let wlCount = 0, notifCount = 0;
  try {
    const token = await getWatchlistToken();
    if (token) {
      const a = await q1('SELECT COUNT(*)::int AS c FROM watchlist WHERE session_token = $1', [token]);
      const b = await q1('SELECT COUNT(*)::int AS c FROM watchlist_notifications WHERE session_token = $1 AND is_read = FALSE', [token]);
      wlCount = a?.c || 0;
      notifCount = b?.c || 0;
    }
  } catch { /* DB not reachable — render nav anyway */ }
  return <NavBar manager={manager} wlCount={wlCount} notifCount={notifCount} />;
}
