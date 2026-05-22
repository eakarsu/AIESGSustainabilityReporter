import React, { useEffect, useState } from 'react';

/**
 * VIZ #1 - ESG composite score trend (E, S, G plotted separately).
 * Uses GET /api/custom-views/esg-score-trend.
 */
export default function EsgScoreTrendChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/custom-views/esg-score-trend', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || 'failed to load trend');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={s.panel}><h3 style={s.h}>ESG Composite Trend</h3><p>Loading...</p></div>;
  if (error)   return <div style={s.panel}><h3 style={s.h}>ESG Composite Trend</h3><p style={s.err}>Error: {error}</p></div>;

  const points = (data && data.points) || [];
  if (points.length === 0) {
    return <div style={s.panel}><h3 style={s.h}>ESG Composite Trend</h3><p>No data available.</p></div>;
  }

  const W = 760, H = 280, pad = 44;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const n = points.length;

  const xFor = (i) => pad + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const yFor = (v) => pad + innerH - ((Math.max(0, Math.min(100, v))) / 100) * innerH;

  const series = [
    { key: 'environmental', color: '#1a7a4a', label: 'Environmental' },
    { key: 'social',        color: '#2d6cdf', label: 'Social' },
    { key: 'governance',    color: '#b87333', label: 'Governance' },
    { key: 'composite',     color: '#7a1f7a', label: 'Composite', dash: '4 3' },
  ];

  const pathFor = (key) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(Number(p[key]) || 0).toFixed(1)}`).join(' ');

  return (
    <div style={s.panel}>
      <h3 style={s.h}>ESG Composite Trend (E / S / G separately)</h3>
      <svg width={W} height={H} role="img" aria-label="ESG score trend">
        <rect x="0" y="0" width={W} height={H} fill="#fafaf6" />
        {/* y gridlines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad} x2={W - pad} y1={yFor(v)} y2={yFor(v)} stroke="#e2e2e2" />
            <text x={pad - 6} y={yFor(v) + 4} fontSize="10" textAnchor="end" fill="#666">{v}</text>
          </g>
        ))}
        {/* x labels */}
        {points.map((p, i) => (
          <text key={i} x={xFor(i)} y={H - pad + 16} fontSize="10" textAnchor="middle" fill="#555">
            {p.reporting_period}
          </text>
        ))}
        {/* series */}
        {series.map((srs) => (
          <g key={srs.key}>
            <path d={pathFor(srs.key)} fill="none" stroke={srs.color} strokeWidth="2"
                  strokeDasharray={srs.dash || ''} />
            {points.map((p, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(Number(p[srs.key]) || 0)} r="3" fill={srs.color} />
            ))}
          </g>
        ))}
      </svg>
      <div style={s.legend}>
        {series.map((srs) => (
          <span key={srs.key} style={s.legendItem}>
            <span style={{ ...s.swatch, background: srs.color }} />
            {srs.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const s = {
  panel:  { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, padding: 16, marginBottom: 20 },
  h:      { margin: '0 0 12px 0', color: '#1a2e1a' },
  err:    { color: '#b91c1c' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: 12, color: '#333' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, display: 'inline-block', borderRadius: 2 },
};
