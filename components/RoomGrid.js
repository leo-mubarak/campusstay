'use client';
// Grid of room cards + shared enquiry modal
import { useState } from 'react';
import RoomCard from './RoomCard';
import EnquiryModal from './EnquiryModal';

export default function RoomGrid({ rooms, watchlistIds = [], priceMode = 'annual', removeOnUnsave = false }) {
  const [enquiryRoom, setEnquiryRoom] = useState(null);
  const [removed, setRemoved] = useState([]);
  const wl = new Set(watchlistIds.map(Number));

  return (
    <>
      <div className="rooms-grid">
        {rooms.filter(r => !removed.includes(r.id)).map(room => (
          <RoomCard
            key={room.id}
            room={room}
            inWatchlist={wl.has(Number(room.id))}
            priceMode={priceMode}
            onEnquire={setEnquiryRoom}
            faded={removeOnUnsave}
            onRemoved={removeOnUnsave ? () => setRemoved(ids => [...ids, room.id]) : undefined}
          />
        ))}
      </div>
      <EnquiryModal open={!!enquiryRoom} room={enquiryRoom} onClose={() => setEnquiryRoom(null)} />
    </>
  );
}
