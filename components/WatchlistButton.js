'use client';
// Heart / save buttons — replaces the watchlist handlers in main.js
import { useState } from 'react';
import { showToast } from './toast';

export default function WatchlistButton({ roomId, initial, variant = 'card', onRemoved }) {
  const [saved, setSaved] = useState(!!initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('room_id', String(roomId));
      const res = await fetch('/api/watchlist', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        const added = data.action === 'added';
        setSaved(added);
        window.dispatchEvent(new CustomEvent('wl-change', { detail: added ? 1 : -1 }));
        showToast(data.message, 'success');
        if (!added && onRemoved) onRemoved();
      } else {
        showToast(data.message || 'Could not update watchlist.', 'error');
      }
    } catch {
      showToast('Could not update watchlist. Please try again.', 'error');
    }
    setBusy(false);
  }

  if (variant === 'lg')
    return (
      <button className={`watchlist-btn-lg ${saved ? 'active' : ''}`} onClick={toggle} disabled={busy}>
        {saved ? '❤ Saved' : '🤍 Save'}
      </button>
    );
  if (variant === 'full')
    return (
      <button className={`watchlist-btn-full ${saved ? 'active' : ''}`} onClick={toggle} disabled={busy}>
        {saved ? '❤ Saved to Watchlist' : '🤍 Save to Watchlist'}
      </button>
    );
  return (
    <button
      className={`watchlist-btn ${saved ? 'active' : ''}`}
      onClick={toggle}
      disabled={busy}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      {saved ? '❤' : '🤍'}
    </button>
  );
}
