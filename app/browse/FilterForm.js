'use client';
// Filter sidebar — ported from the filter form in browse.php + main.js sliders
import { useRef, useState } from 'react';
import { VALID_TYPES, VALID_GENDERS } from '@/lib/utils';

export default function FilterForm({ universities, values, maxDbPrice }) {
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

      <div className="filter-section">
        <h4>🎓 University</h4>
        <label className="filter-option">
          <input type="radio" name="university_id" value="0" defaultChecked={!values.universityId} onChange={submit} />
          <span>All universities</span>
        </label>
        {universities.map(u => (
          <label className="filter-option" key={u.id}>
            <input type="radio" name="university_id" value={u.id} defaultChecked={values.universityId === u.id} onChange={submit} />
            <span>{u.short_name} <small style={{ color: 'var(--text-3)' }}>— {u.name}</small></span>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h4>📦 Room Type</h4>
        {VALID_TYPES.map(t => (
          <label className="filter-option" key={t}>
            <input type="radio" name="room_type" value={t} defaultChecked={values.roomType === t} onChange={submit} />
            <span>{t}</span>
          </label>
        ))}
        <label className="filter-option">
          <input type="radio" name="room_type" value="" defaultChecked={values.roomType === ''} onChange={submit} />
          <span>All types</span>
        </label>
      </div>

      <div className="filter-section">
        <h4>👤 Gender</h4>
        {VALID_GENDERS.map(g => (
          <label className="filter-option" key={g}>
            <input type="radio" name="gender_spec" value={g} defaultChecked={values.genderSpec === g} onChange={submit} />
            <span>{g}</span>
          </label>
        ))}
        <label className="filter-option">
          <input type="radio" name="gender_spec" value="" defaultChecked={values.genderSpec === ''} onChange={submit} />
          <span>All</span>
        </label>
      </div>

      <div className="filter-section">
        <h4>💰 Max Annual Price</h4>
        <div className="range-wrap">
          <input type="range" name="max_price" min="0" max={maxDbPrice} step="100"
            value={price} onChange={e => setPrice(Number(e.target.value))} />
          <span className="range-val">GHS {Number(price).toLocaleString()}</span>
        </div>
      </div>

      <div className="filter-section">
        <h4>📍 Max Distance (km)</h4>
        <div className="range-wrap">
          <input type="range" name="max_dist" min="0" max="5" step="0.1"
            value={dist} onChange={e => setDist(Number(e.target.value))} />
          <span className="range-val">{dist} km</span>
        </div>
      </div>

      <div className="filter-section">
        <h4>✅ Availability</h4>
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
