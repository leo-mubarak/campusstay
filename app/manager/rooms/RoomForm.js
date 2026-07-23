'use client';
import Icon from '@/components/Icon';
// Add/edit room form — ported from room-form.php (amenity chips, upload zone, media delete)
import { useRef, useState } from 'react';
import Link from 'next/link';
import { VALID_TYPES, VALID_GENDERS } from '@/lib/utils';

const QUICK_AMENITIES = ['WiFi','Water','Electricity','Fan','AC','Wardrobe','Kitchen','Laundry','Security','CCTV','Balcony','Gym','Study Room','Fridge','Parking'];

export default function RoomForm({ room, mediaItems = [], universities, accountHostelName = '', uploadsEnabled }) {
  const [amenities, setAmenities] = useState(room?.amenities || '');
  const [media, setMedia] = useState(mediaItems);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const selected = amenities.split(',').map(s => s.trim()).filter(Boolean);

  function toggleChip(val) {
    const current = amenities.split(',').map(s => s.trim()).filter(Boolean);
    setAmenities(
      current.includes(val) ? current.filter(v => v !== val).join(', ') : [...current, val].join(', ')
    );
  }

  function previewFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setPreviews(p => [...p, { type: 'image', src: e.target.result }]);
        reader.readAsDataURL(file);
      } else {
        setPreviews(p => [...p, { type: 'video' }]);
      }
    });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (fileRef.current) {
      fileRef.current.files = e.dataTransfer.files;
      previewFiles(e.dataTransfer.files);
    }
  }

  async function deleteMedia(mediaId) {
    if (!window.confirm('Delete this image?')) return;
    const res = await fetch(`/api/rooms?action=delete-media&media_id=${mediaId}`);
    const data = await res.json();
    if (data.success) setMedia(m => m.filter(x => x.id !== mediaId));
    else alert(data.message || 'Could not delete media.');
  }

  return (
    <form method="POST" action="/api/rooms" encType="multipart/form-data">
      <input type="hidden" name="action" value="save" />
      {room && <input type="hidden" name="room_id" value={room.id} />}

      <div className="card card-body form-section-card">
        <h3>Basic Information</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Hostel / Property Name <span className="req">*</span></label>
            {/* Auto-filled from the manager's account so it never has to be
                retyped. Read-only when the account has a hostel name; older
                accounts without one can still type it. */}
            <input type="text" name="hostel_name" className="form-control" required
              defaultValue={room?.hostel_name || accountHostelName}
              readOnly={!!accountHostelName}
              style={accountHostelName ? { background: 'var(--bg-2)', cursor: 'not-allowed' } : undefined}
              placeholder="e.g. Sunrise Hostel" />
            {accountHostelName ? (
              <div className="form-hint">Auto-filled from your account. To change it, go to Dashboard → Profile.</div>
            ) : null}
          </div>
          <div className="form-group">
            <label>Room Number / Identifier <span className="req">*</span></label>
            <input type="text" name="room_identifier" className="form-control" required
              defaultValue={room?.room_identifier || ''} placeholder="e.g. Block A-1, Room 4C" />
          </div>
          <div className="form-group">
            <label>University / Campus <span className="req">*</span></label>
            <select name="university_id" className="form-control" required defaultValue={room?.university_id || ''}>
              <option value="">— Select University —</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>
              ))}
            </select>
            <div className="form-hint">Select the university this hostel is closest to.</div>
          </div>
          <div className="form-group">
            <label>Room Type <span className="req">*</span></label>
            <select name="room_type" className="form-control" required defaultValue={room?.room_type || 'Single'}>
              {VALID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="form-hint">Single = 1 bed, Two-in-one = 2 beds shared, etc.</div>
          </div>
          <div className="form-group">
            <label>Gender Specification <span className="req">*</span></label>
            <select name="gender_spec" className="form-control" required defaultValue={room?.gender_spec || 'Male Only'}>
              {VALID_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Availability <span className="req">*</span></label>
            <select name="availability" className="form-control" required defaultValue={room?.availability || 'Available'}>
              <option value="Available">Available</option>
              <option value="Fully Booked">Fully Booked</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Description</label>
            <textarea name="description" className="form-control" rows={4}
              defaultValue={room?.description || ''}
              placeholder="Describe the room, nearby facilities, rules, what's included..." />
          </div>
        </div>
      </div>

      <div className="card card-body form-section-card">
        <h3>Pricing</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Annual Price (GHS) <span className="req">*</span></label>
            <input type="number" name="annual_price" className="form-control" required min="0" step="50"
              defaultValue={room?.annual_price || ''} placeholder="e.g. 4500" />
            <div className="form-hint">Full academic year rate</div>
          </div>
          <div className="form-group">
            <label>Semester Price (GHS)</label>
            <input type="number" name="semester_price" className="form-control" min="0" step="50"
              defaultValue={room?.semester_price || ''} placeholder="e.g. 2500" />
            <div className="form-hint">Single semester rate (optional)</div>
          </div>
        </div>
      </div>

      <div className="card card-body form-section-card">
        <h3>Location &amp; Proximity</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Distance from Campus Gate (km)</label>
            <input type="number" name="distance_km" className="form-control" min="0" step="0.1"
              defaultValue={room?.distance_km || ''} placeholder="e.g. 0.5" />
          </div>
          <div className="form-group">
            <label>Walking Time (minutes)</label>
            <input type="number" name="walk_minutes" className="form-control" min="0"
              defaultValue={room?.walk_minutes || ''} placeholder="e.g. 7" />
          </div>
        </div>
      </div>

      <div className="card card-body form-section-card">
        <h3>Amenities</h3>
        <div className="form-group">
          <label>Amenities (comma separated)</label>
          <input type="text" name="amenities" className="form-control" value={amenities}
            onChange={e => setAmenities(e.target.value)}
            placeholder="e.g. WiFi, Water, Electricity, Fan, Balcony, Kitchen, Laundry" />
          <div className="form-hint">Students see these as tags on your listing.</div>
        </div>
        <div className="amenity-quick-picks">
          {QUICK_AMENITIES.map(chip => (
            <button type="button" key={chip}
              className={`amenity-quick-chip ${selected.includes(chip) ? 'selected' : ''}`}
              onClick={() => toggleChip(chip)}>{chip}</button>
          ))}
        </div>
      </div>

      <div className="card card-body form-section-card">
        <h3>Media Gallery</h3>
        {!uploadsEnabled && (
          <div className="alert alert-warning" style={{ marginBottom: 14 }}>
            Photo uploads aren&apos;t configured yet — add Blob storage to your Vercel project (see the README) to enable them.
          </div>
        )}
        <p style={{ fontSize: 14, marginBottom: 18 }}>Upload photos and optional video tour. JPG, PNG, MP4 — max 10MB each.</p>
        {media.length > 0 && (
          <div className="existing-media" style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 14, marginBottom: 10 }}>Existing media</h4>
            <div className="gallery">
              {media.map(m => (
                <div className="gallery-item" key={m.id}>
                  {m.media_type === 'photo'
                    ? <img src={m.file_path} alt="" />
                    : <video src={m.file_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <button type="button" className="gallery-delete-btn" onClick={() => deleteMedia(m.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="upload-icon"><Icon name="camera" size={30} color="var(--primary)" /></div>
          <p>Click or drag &amp; drop photos / video tour</p>
          <small>JPG, PNG, WEBP, MP4, WEBM — Max 10MB each</small>
        </div>
        <input type="file" ref={fileRef} name="media_files" accept="image/*,video/*" multiple
          style={{ display: 'none' }} onChange={e => previewFiles(e.target.files)} />
        {previews.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>New files to upload</h4>
            <div className="gallery">
              {previews.map((p, i) => (
                <div className="gallery-item" key={i}>
                  {p.type === 'image'
                    ? <img src={p.src} alt="preview" />
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-2)', fontSize: '2rem' }}><Icon name="video" size={26} color="var(--text-3)" /></div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-lg">
          {room ? 'Update Listing' : 'Publish Listing'}
        </button>
        <Link href="/manager/dashboard" className="btn btn-outline btn-lg">Cancel</Link>
      </div>
    </form>
  );
}
