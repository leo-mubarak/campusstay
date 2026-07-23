'use client';
// app/rooms/[id]/Gallery.js
// Photo/video gallery with:
//  - automatic slideshow (advances every 4 seconds, pauses on hover)
//  - Previous / Next arrow buttons
//  - dot indicators showing the current item
//  - clickable thumbnails
//  - CLICK any photo -> full-screen lightbox with its own arrows, dots,
//    photo counter, keyboard support (arrow keys + Escape) and close button
import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/Icon';

const AUTOPLAY_MS = 4000; // time between automatic slides

export default function Gallery({ media }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [hovering, setHovering] = useState(false);
  const main = media[current];
  const count = media.length;

  // Move to another item (wraps around at both ends).
  const goTo = useCallback(
    (index) => setCurrent((index + count) % count),
    [count]
  );

  // ---------- AUTOPLAY ----------
  // Advances automatically unless the user is hovering the gallery,
  // the lightbox is open, or the current item is a video.
  useEffect(() => {
    if (count < 2 || hovering || lightbox) return;
    if (media[current].media_type !== 'photo') return; // let videos play
    const timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, hovering, lightbox, current, goTo, media]);

  // ---------- KEYBOARD (lightbox) ----------
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, current, goTo]);

  return (
    <div
      className="room-gallery"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ---------- MAIN IMAGE / VIDEO ---------- */}
      <div className="gallery-main" style={{ position: 'relative' }}>
        {main.media_type === 'photo' ? (
          <img
            src={main.file_path}
            alt={`Room photo ${current + 1} of ${count}`}
            onClick={() => setLightbox(true)}
            style={{ cursor: 'zoom-in' }}
          />
        ) : (
          <video src={main.file_path} controls className="gallery-main-video" />
        )}

        {/* Previous / Next arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-left"
              onClick={() => goTo(current - 1)}
              aria-label="Previous photo"
            >
              &#8249;
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-right"
              onClick={() => goTo(current + 1)}
              aria-label="Next photo"
            >
              &#8250;
            </button>
          </>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="gallery-dots">
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`gallery-dot ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- THUMBNAILS ---------- */}
      {count > 1 && (
        <div className="gallery-thumbs">
          {media.map((m, i) => (
            <div
              key={m.id}
              className={`gallery-thumb ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            >
              {m.media_type === 'photo'
                ? <img src={m.file_path} alt="" />
                : <div className="thumb-video-icon"><Icon name="video" size={22} color="var(--text-3)" /></div>}
            </div>
          ))}
        </div>
      )}

      {/* ---------- LIGHTBOX (full-screen viewer) ---------- */}
      {lightbox && main.media_type === 'photo' && (
        <div
          className="gallery-lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) setLightbox(false); }}
        >
          <img
            src={main.file_path}
            alt={`Room photo ${current + 1} of ${count}, full screen`}
          />

          {/* Close */}
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label="Close full screen viewer"
          >
            &#10005;
          </button>

          {/* Counter, e.g. "2 / 5" */}
          {count > 1 && (
            <div className="lightbox-counter">{current + 1} / {count}</div>
          )}

          {/* Arrows */}
          {count > 1 && (
            <>
              <button
                type="button"
                className="gallery-arrow gallery-arrow-left lightbox-arrow"
                onClick={() => goTo(current - 1)}
                aria-label="Previous photo"
              >
                &#8249;
              </button>
              <button
                type="button"
                className="gallery-arrow gallery-arrow-right lightbox-arrow"
                onClick={() => goTo(current + 1)}
                aria-label="Next photo"
              >
                &#8250;
              </button>
            </>
          )}

          {/* Dots */}
          {count > 1 && (
            <div className="gallery-dots lightbox-dots">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  className={`gallery-dot ${i === current ? 'active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
