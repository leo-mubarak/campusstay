'use client';
// Photo/video gallery with thumbnail switching — ported from room.php + main.js
import { useState } from 'react';

export default function Gallery({ media }) {
  const [current, setCurrent] = useState(0);
  const main = media[current];
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="room-gallery">
      <div className="gallery-main">
        {main.media_type === 'photo' ? (
          <img src={main.file_path} alt="Room photo" onClick={() => setLightbox(true)} style={{ cursor: 'zoom-in' }} />
        ) : (
          <video src={main.file_path} controls className="gallery-main-video" />
        )}
      </div>
      {media.length > 1 && (
        <div className="gallery-thumbs">
          {media.map((m, i) => (
            <div key={m.id} className={`gallery-thumb ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)}>
              {m.media_type === 'photo' ? <img src={m.file_path} alt="" /> : <div className="thumb-video-icon">🎬</div>}
            </div>
          ))}
        </div>
      )}
      {lightbox && main.media_type === 'photo' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: 20 }}
          onClick={() => setLightbox(false)}
        >
          <img src={main.file_path} alt="" style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,.5)' }} />
        </div>
      )}
    </div>
  );
}
