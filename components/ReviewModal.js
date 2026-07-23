'use client';
// Review modal with star picker — ported from review_modal.php + main.js
import { useState } from 'react';
import { showToast } from './toast';

export default function ReviewModal({ open, roomId, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  if (!open) return null;
  const shown = hover || rating;

  async function submit(e) {
    e.preventDefault();
    if (!rating) { showToast('Please select a star rating.', 'error'); return; }
    setSending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('rating', String(rating));
      const res = await fetch('/api/review', { method: 'POST', body: fd });
      setResult(await res.json());
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    }
    setSending(false);
  }

  return (
    <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: 14 }}>
              {result.success
                ? <span className="result-icon result-star">&#9733;</span>
                : <span className="result-icon result-bad">&#10005;</span>}
            </div>
            <h3 style={{ marginBottom: 10 }}>{result.success ? 'Review Submitted!' : 'Error'}</h3>
            <p style={{ color: 'var(--text-2)' }}>{result.message}</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }}
              onClick={() => { onClose(); if (result.success) window.location.reload(); }}>
              {result.success ? 'View Reviews' : 'Close'}
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Leave a Review</h3>
              <p>Share your experience to help other students.</p>
            </div>
            <form onSubmit={submit}>
              <input type="hidden" name="room_id" value={roomId} />
              <div className="form-group">
                <label>Your Name <span className="req">*</span></label>
                <input type="text" name="reviewer_name" className="form-control" required placeholder="e.g. Kofi Mensah" />
              </div>
              <div className="form-group">
                <label>Email Address <span className="req">*</span></label>
                <input type="email" name="reviewer_email" className="form-control" required placeholder="you@example.com" />
                <div className="form-hint">Used to prevent duplicate reviews. Not shown publicly.</div>
              </div>
              <div className="form-group">
                <label>Rating <span className="req">*</span></label>
                <div className="star-picker" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <span key={v}
                      className={`star-pick ${shown >= v ? 'selected' : ''}`}
                      onMouseOver={() => setHover(v)}
                      onClick={() => setRating(v)}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Your Review</label>
                <textarea name="comment" className="form-control" rows={4}
                  placeholder="Tell us about cleanliness, security, management responsiveness..." />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
                {sending ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
