'use client';
// components/DeleteAccountForm.js
// Danger Zone in the dashboard profile tab: permanently delete the
// manager's own account. Requires the current password + a confirmation
// dialog before anything is sent to the server.

import { useState } from 'react';
import Icon from './Icon';

export default function DeleteAccountForm() {
  const [open, setOpen] = useState(false); // reveals the confirm section

  // Ask "are you really sure?" right before the form submits.
  function confirmSubmit(e) {
    const ok = window.confirm(
      'Delete your account permanently?\n\n' +
      'This removes your profile, ALL your room listings, their photos, ' +
      'enquiries and reviews. This cannot be undone.'
    );
    if (!ok) e.preventDefault();
  }

  return (
    <div
      style={{
        border: '1px solid #fecaca',
        background: '#fef2f2',
        borderRadius: 12,
        padding: 18,
      }}
    >
      <h3 style={{ color: 'var(--danger)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="warn" size={17} /> Danger Zone
      </h3>
      <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14 }}>
        Deleting your account removes your profile, all your room listings,
        photos, enquiries and reviews permanently.
      </p>

      {!open ? (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          onClick={() => setOpen(true)}
        >
          <Icon name="trash" size={14} /> Delete My Account
        </button>
      ) : (
        <form method="POST" action="/api/auth" onSubmit={confirmSubmit}>
          <input type="hidden" name="action" value="delete_account" />
          <div className="form-group">
            <label>Confirm with your password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              required
              placeholder="Your current password"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-danger">
              <Icon name="trash" size={14} /> Permanently Delete Account
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
