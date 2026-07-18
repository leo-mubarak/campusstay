'use client';
// Link that asks for confirmation first (replaces [data-confirm] in main.js)
export default function ConfirmLink({ href, confirm, className, children }) {
  return (
    <a
      href={href}
      className={className}
      onClick={e => { if (!window.confirm(confirm)) e.preventDefault(); }}
    >
      {children}
    </a>
  );
}
