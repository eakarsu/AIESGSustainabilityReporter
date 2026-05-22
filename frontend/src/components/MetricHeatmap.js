import React, { useEffect, useState } from 'react';

/**
 * VIZ #2 - Metric x reporting-period heatmap.
 * Uses GET /api/custom-views/metric-heatmap.
 */
export default function MetricHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/custom-views/metric-heatmap', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || 'failed to load heatmap');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={s.panel}><h3 style={s.h}>Metric Heatmap</h3><p>Loading...</p></div>;
  if (error)   return <div style={s.panel}><h3 style={s.h}>Metric Heatmap</h3><p style={s.err}>Error: {error}</p></div>;

  const metrics = (data && data.metrics) || [];
  const periods = (data && data.periods) || [];
  const cells   = (data && data.cells)   || [];

  if (metrics.length === 0 || periods.length === 0) {
    return <div style={s.panel}><h3 style={s.h}>Metric Heatmap</h3><p>No data available.</p></div>;
  }

  // index cells by "metric|period"
  const index = new Map();
  for (const c of cells) index.set(`${c.metric}|${c.period}`, c);

  const colorFor = (val) => {
    if (val == null) return '#f0f0f0';
    // val in 0..1.5 — clamp & map to a green→amber→red ramp
    const v = Math.max(0, Math.min(1.5, val));
    if (v < 0.5) {
      const t = v / 0.5; // 0..1 red->amber
      return `rgb(${230 - t * 60}, ${130 + t * 70}, 60)`;
    }
    const t = (v - 0.5) / 1.0; // 0..1 amber->green
    return `rgb(${230 - t * 200}, ${200 - t * 80}, ${60 + t * 60})`;
  };

  const cellW = 90;
  const cellH = 28;

  return (
    <div style={s.panel}>
      <h3 style={s.h}>Metric Heatmap (Metric x Reporting Period)</h3>
      <p style={s.sub}>Cell intensity = current / target (clamped 0–1.5).</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...s.th, minWidth: 220, textAlign: 'left' }}>Metric</th>
              {periods.map((p) => (
                <th key={p} style={{ ...s.th, minWidth: cellW }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m}>
                <td style={{ ...s.td, fontWeight: 600 }}>{m}</td>
                {periods.map((p) => {
                  const c = index.get(`${m}|${p}`);
                  const intensity = c ? c.intensity : null;
                  const tooltip = c
                    ? `${m} @ ${p}\ncurrent: ${c.current_value}\ntarget: ${c.target_value}\nintensity: ${intensity}`
                    : 'no data';
                  return (
                    <td key={p}
                        title={tooltip}
                        style={{
                          ...s.td,
                          width: cellW,
                          height: cellH,
                          background: colorFor(intensity),
                          textAlign: 'center',
                          color: '#fff',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                      {intensity != null ? intensity.toFixed(2) : '–'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  panel: { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, padding: 16, marginBottom: 20 },
  h:     { margin: '0 0 6px 0', color: '#1a2e1a' },
  sub:   { margin: '0 0 12px 0', fontSize: 12, color: '#666' },
  err:   { color: '#b91c1c' },
  th:    { padding: '6px 8px', borderBottom: '1px solid #ccc', background: '#f3f5f3', textAlign: 'center', color: '#222' },
  td:    { padding: '4px 6px', border: '1px solid #fff', verticalAlign: 'middle' },
};
