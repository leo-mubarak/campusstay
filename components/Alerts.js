'use client';
// Flash messages via ?success= / ?error= query params (replaces PHP flash())
import { useEffect, useState } from 'react';

export default function Alerts({ success, error }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!visible || (!success && !error)) return null;
  return (
    <>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
}
