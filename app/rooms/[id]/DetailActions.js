'use client';
// Enquiry + review buttons and their modals on the room detail page
import { useState } from 'react';
import EnquiryModal from '@/components/EnquiryModal';
import ReviewModal from '@/components/ReviewModal';

export default function DetailActions({ room, waLink }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary btn-full btn-lg" onClick={() => setOpen(true)}>✉ Send Enquiry</button>
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-full" style={{ marginTop: 10 }}>
          💬 WhatsApp Manager
        </a>
      )}
      <p className="sidebar-note">Manager typically responds within 24 hours</p>
      <EnquiryModal open={open} room={room} onClose={() => setOpen(false)} />
    </>
  );
}

export function ReviewButton({ roomId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>✏ Write a Review</button>
      <ReviewModal open={open} roomId={roomId} onClose={() => setOpen(false)} />
    </>
  );
}
