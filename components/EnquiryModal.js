'use client';
import Icon from './Icon';
// Enquiry modal — ported from views/components/enquiry_modal.php + main.js
import { useState, useEffect } from 'react';
import { formatWhatsApp } from '@/lib/utils';

export default function EnquiryModal({ open, room, onClose }) {
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (open) setResult(null); }, [open, room]);
  if (!open || !room) return null;

  const roomName = `${room.hostel_name} — ${room.room_identifier}`;
  const wa = room.manager_whatsapp ? formatWhatsApp(room.manager_whatsapp) : '';
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I found your listing on CampusStay: ${roomName}. Is it still available?`)}`
    : '';

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch('/api/enquiry', { method: 'POST', body: fd });
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
                ? <span className="result-icon result-ok">&#10003;</span>
                : <span className="result-icon result-bad">&#10005;</span>}
            </div>
            <h3 style={{ marginBottom: 10 }}>{result.success ? 'Enquiry Sent!' : 'Something went wrong'}</h3>
            <p style={{ color: 'var(--text-2)' }}>{result.message}</p>
            {result.success && waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ marginTop: 16 }}>
                Also Contact via WhatsApp
              </a>
            )}
            <div><button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Enquire About <span>{roomName}</span></h3>
              <p>Fill in your details and the manager will contact you shortly.</p>
            </div>
            <form onSubmit={submit}>
              <input type="hidden" name="room_id" value={room.id} />
              <div className="form-section-label">Your Details</div>
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input type="text" name="student_name" className="form-control" required placeholder="e.g. Kofi Mensah" />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Email Address <span className="req">*</span></label>
                  <input type="email" name="student_email" className="form-control" required placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label>Phone / WhatsApp</label>
                  <input type="tel" name="student_phone" className="form-control" placeholder="0XX XXX XXXX" />
                </div>
              </div>
              <div className="form-section-label">Academic Info <span className="optional-label">(optional)</span></div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Course / Programme</label>
                  <input type="text" name="student_course" className="form-control" placeholder="e.g. BSc Computer Science" />
                </div>
                <div className="form-group">
                  <label>Level / Year</label>
                  <select name="student_level" className="form-control" defaultValue="">
                    <option value="">— Select —</option>
                    <option>Level 100</option><option>Level 200</option>
                    <option>Level 300</option><option>Level 400</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Message <span className="req">*</span></label>
                <textarea name="message" className="form-control" rows={4} required
                  placeholder="Hi, I'm interested in this room. Is it still available?..." />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
                  <span className="btn-icon"><Icon name="mail" size={15} color="#fff" /></span> {sending ? 'Sending…' : 'Send Enquiry'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
