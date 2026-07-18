// lib/utils.js — shared helpers (ported from config.php)

export function formatWhatsApp(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  // Ghana: 0XX... -> 233XX...
  if (clean.length === 10 && clean[0] === '0') return '233' + clean.slice(1);
  return clean;
}

export function whatsAppLink(phone, message = '') {
  const num = formatWhatsApp(phone);
  const msg = message ? '?text=' + encodeURIComponent(message) : '';
  return `https://wa.me/${num}${msg}`;
}

export function amenityList(amenities) {
  return String(amenities || '').split(',').map(s => s.trim()).filter(Boolean);
}

export function genderBadge(gender) {
  if (gender === 'Male Only') return { cls: 'badge-male', icon: '♂' };
  if (gender === 'Female Only') return { cls: 'badge-female', icon: '♀' };
  return { cls: 'badge-mixed', icon: '⚥' };
}

// number_format equivalents (pg returns DECIMAL as strings)
export const n0 = v => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
export const n1 = v => Number(v || 0).toFixed(1);

export const fmtDate = d =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtDateTime = d =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
  ' · ' + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export const VALID_TYPES = ['Single', 'Two-in-one', 'Three-in-one', 'Four-in-one'];
export const VALID_GENDERS = ['Male Only', 'Female Only', 'Mixed/Universal'];
