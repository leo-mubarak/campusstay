'use client';
// Toast notifications (ported from showToast in main.js)
export function showToast(message, type = 'success') {
  const existing = document.querySelector('.cs-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'cs-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 20px; border-radius:10px; font-size:14px; font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,.15); max-width:320px;
    background:${type === 'success' ? '#166534' : '#991b1b'}; color:#fff;
    transform:translateY(10px); opacity:0; transition:all .25s ease;`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
