'use client';
// Filter sidebar — ported from the filter form in browse.php + main.js sliders
import { useRef, useState } from 'react';

export default function FilterForm({ universities, roomTypes, genders, values, maxDbPrice }) {
  const formRef = useRef(null);
  const [price, setPrice] = useState(values.maxPrice > 0 ? values.maxPrice : maxDbPrice);
  const [dist, setDist] = useState(values.maxDist > 0 ? values.maxDist : 5);
  const submit = () => formRef.current?.requestSubmit();

  return (
    <form method="GET" action="/browse" ref={formRef}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select name="price_mode" defaultValue={values.priceMode} className="form-control form-control-sm" onChange={submit}>
          <option value="annual">Annual price</option>
          <option value="semester">Semester price</option>
        </select>
        <select name="sort" defaultValue={values.sort} className="form-control form-control-sm" onChange={submit}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: Low–High</option>
          <option value="price_desc">Price: High–Low</option>
          <option value="closest">Closest to campus</option>
          <option value="top_rated">Top rated</option>
        </select>
      </div>

      {/* University — dropdown populated from the universities table */}
      <div className="filter-section">
        <h4>University</h4>
        <select
          name="university_id"
          className="form-control"
          defaultValue={values.universityId || '0'}
          onChange={submit}
        >
          <option value="0">All Universities</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>
              {u.short_name} — {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Room Type — dropdown populated from the room types actually in use */}
      <div className="filter-section">
        <h4>Room Type</h4>
        <select
          name="room_type"
          className="form-control"
          defaultValue={values.roomType || ''}
          onChange={submit}
        >
          <option value="">All Room Types</option>
          {roomTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Gender — dropdown populated from the gender specs actually in use */}
      <div className="filter-section">
        <h4>Gender</h4>
        <select
          name="gender_spec"
          className="form-control"
          defaultValue={values.genderSpec || ''}
          onChange={submit}
        >
          <option value="">All Genders</option>
          {genders.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h4>Max Annual Price</h4>
        <div className="range-wrap">
          <input type="range" name="max_price" min="0" max={maxDbPrice} step="100"
            value={price} onChange={e => setPrice(Number(e.target.value))} />
          <span className="range-val">GHS {Number(price).toLocaleString()}</span>
        </div>
      </div>

      <div className="filter-section">
        <h4>Max Distance (km)</h4>
        <div className="range-wrap">
          <input type="range" name="max_dist" min="0" max="5" step="0.1"
            value={dist} onChange={e => setDist(Number(e.target.value))} />
          <span className="range-val">{dist} km</span>
        </div>
      </div>

      <div className="filter-section">
        <h4>Availability</h4>
        <label className="filter-option">
          <input type="checkbox" name="avail_only" value="1" defaultChecked={values.availOnly} onChange={submit} />
          <span>Available rooms only</span>
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-full">Apply Filters</button>
      <a href="/browse" className="btn btn-outline btn-full" style={{ marginTop: 8 }}>Clear All</a>
    </form>
  );
}
