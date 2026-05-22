import React, { useEffect, useState, useCallback } from 'react';

/**
 * NON-VIZ #2 - Framework rules CRUD editor (GRI / SASB / TCFD).
 * Uses /api/custom-views/framework-rules (GET/POST/PUT/DELETE).
 */
export default function FrameworkRulesEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ framework: '', pillar: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(newForm());

  function newForm() {
    return {
      framework: 'GRI', code: '', pillar: 'environmental',
      metric_name: '', description: '', mapping: '', mandatory: false,
    };
  }

  const headers = useCallback(() => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (filter.framework) qs.set('framework', filter.framework);
      if (filter.pillar)    qs.set('pillar',    filter.pillar);
      const url = '/api/custom-views/framework-rules' + (qs.toString() ? `?${qs}` : '');
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json.data || []);
    } catch (e) {
      setError(e.message || 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter, headers]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (row) => {
    setEditing(row.id);
    setForm({
      framework: row.framework, code: row.code, pillar: row.pillar,
      metric_name: row.metric_name || '', description: row.description || '',
      mapping: row.mapping || '', mandatory: !!row.mandatory,
    });
  };

  const cancelEdit = () => { setEditing(null); setForm(newForm()); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editing) {
        res = await fetch(`/api/custom-views/framework-rules/${editing}`, {
          method: 'PUT', headers: headers(), body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/custom-views/framework-rules', {
          method: 'POST', headers: headers(), body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      cancelEdit();
      load();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/custom-views/framework-rules/${id}`, {
        method: 'DELETE', headers: headers(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      load();
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  return (
    <div style={s.panel}>
      <h3 style={s.h}>Reporting Framework Rules Editor (GRI / SASB / TCFD)</h3>

      <div style={s.filters}>
        <label style={s.lbl}>Framework
          <select value={filter.framework}
                  onChange={(e) => setFilter({ ...filter, framework: e.target.value })}
                  style={s.in}>
            <option value="">all</option>
            <option value="GRI">GRI</option>
            <option value="SASB">SASB</option>
            <option value="TCFD">TCFD</option>
          </select>
        </label>
        <label style={s.lbl}>Pillar
          <select value={filter.pillar}
                  onChange={(e) => setFilter({ ...filter, pillar: e.target.value })}
                  style={s.in}>
            <option value="">all</option>
            <option value="environmental">environmental</option>
            <option value="social">social</option>
            <option value="governance">governance</option>
          </select>
        </label>
      </div>

      {error && <div style={s.err}>Error: {error}</div>}

      <form onSubmit={submit} style={s.form}>
        <strong>{editing ? `Editing rule #${editing}` : 'Add new rule'}</strong>
        <div style={s.row}>
          <label style={s.lbl}>Framework
            <select value={form.framework}
                    onChange={(e) => setForm({ ...form, framework: e.target.value })}
                    style={s.in}>
              <option value="GRI">GRI</option>
              <option value="SASB">SASB</option>
              <option value="TCFD">TCFD</option>
            </select>
          </label>
          <label style={s.lbl}>Code
            <input value={form.code}
                   onChange={(e) => setForm({ ...form, code: e.target.value })}
                   style={s.in} required />
          </label>
          <label style={s.lbl}>Pillar
            <select value={form.pillar}
                    onChange={(e) => setForm({ ...form, pillar: e.target.value })}
                    style={s.in}>
              <option value="environmental">environmental</option>
              <option value="social">social</option>
              <option value="governance">governance</option>
            </select>
          </label>
        </div>
        <div style={s.row}>
          <label style={{ ...s.lbl, flex: 1 }}>Metric name
            <input value={form.metric_name}
                   onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                   style={s.in} />
          </label>
          <label style={{ ...s.lbl, flex: 1 }}>Mapping (table.column)
            <input value={form.mapping}
                   onChange={(e) => setForm({ ...form, mapping: e.target.value })}
                   style={s.in} />
          </label>
          <label style={s.lblChk}>
            <input type="checkbox" checked={form.mandatory}
                   onChange={(e) => setForm({ ...form, mandatory: e.target.checked })} />
            mandatory
          </label>
        </div>
        <label style={s.lbl}>Description
          <textarea value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ ...s.in, height: 50 }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={s.btn}>{editing ? 'Save' : 'Create'}</button>
          {editing && <button type="button" style={s.btnAlt} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Framework</th>
                <th style={s.th}>Code</th>
                <th style={s.th}>Pillar</th>
                <th style={s.th}>Metric</th>
                <th style={s.th}>Mapping</th>
                <th style={s.th}>Mandatory</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ ...s.tdc, color: '#888' }}>No rules.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={s.tdc}>{r.framework}</td>
                  <td style={s.tdc}>{r.code}</td>
                  <td style={s.tdc}>{r.pillar}</td>
                  <td style={s.tdc}>{r.metric_name || ''}</td>
                  <td style={s.tdc}><code>{r.mapping || ''}</code></td>
                  <td style={s.tdc}>{r.mandatory ? 'yes' : 'no'}</td>
                  <td style={s.tdc}>
                    <button style={s.miniBtn} onClick={() => startEdit(r)}>edit</button>
                    <button style={{ ...s.miniBtn, color: '#b91c1c', borderColor: '#fca5a5' }}
                            onClick={() => remove(r.id)}>del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  panel:  { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, padding: 16, marginBottom: 20 },
  h:      { margin: '0 0 12px 0', color: '#1a2e1a' },
  err:    { color: '#b91c1c', fontSize: 13, marginBottom: 8 },
  filters:{ display: 'flex', gap: 12, marginBottom: 12 },
  form:   { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#f8faf8',
            border: '1px solid #d1ddd1', borderRadius: 6 },
  row:    { display: 'flex', gap: 12, flexWrap: 'wrap' },
  lbl:    { display: 'flex', flexDirection: 'column', fontSize: 12, color: '#333' },
  lblChk: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#333' },
  in:     { padding: '6px 8px', border: '1px solid #c8d2c8', borderRadius: 4, fontSize: 13, background: '#fff' },
  btn:    { padding: '8px 14px', background: '#1a7a4a', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer', fontWeight: 600 },
  btnAlt: { padding: '8px 14px', background: '#fff', color: '#333', border: '1px solid #ccc',
            borderRadius: 4, cursor: 'pointer' },
  table:  { borderCollapse: 'collapse', width: '100%', fontSize: 12 },
  th:     { padding: '6px 8px', borderBottom: '1px solid #ccc', background: '#f3f5f3', textAlign: 'left' },
  tdc:    { padding: '5px 8px', borderBottom: '1px solid #eee' },
  miniBtn:{ background: '#fff', border: '1px solid #c8d2c8', borderRadius: 3, padding: '2px 8px',
            marginRight: 4, cursor: 'pointer', fontSize: 11 },
};
