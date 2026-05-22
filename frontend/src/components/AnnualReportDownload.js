import React, { useState } from 'react';

/**
 * NON-VIZ #1 - Trigger PDF download for annual ESG report.
 * Uses GET /api/custom-views/annual-report.pdf (returns application/pdf).
 */
export default function AnnualReportDownload() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/annual-report.pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'annual-esg-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Download started.');
    } catch (e) {
      setMessage('Download failed: ' + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.panel}>
      <h3 style={s.h}>Annual ESG Report (PDF)</h3>
      <p style={s.p}>
        Generates a server-side PDF that consolidates your reports, carbon
        footprint snapshots, and sustainability metrics into a single document.
      </p>
      <button onClick={download} disabled={busy} style={s.btn}>
        {busy ? 'Generating...' : 'Download Annual Report'}
      </button>
      {message && <div style={s.msg}>{message}</div>}
    </div>
  );
}

const s = {
  panel: { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, padding: 16, marginBottom: 20 },
  h:     { margin: '0 0 6px 0', color: '#1a2e1a' },
  p:     { fontSize: 13, color: '#333', margin: '0 0 12px 0' },
  btn:   { padding: '10px 18px', background: 'linear-gradient(135deg,#1a7a4a,#22945a)',
           color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  msg:   { marginTop: 10, fontSize: 13, color: '#1a4a2e' },
};
