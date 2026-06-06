import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Screen 13: Practices library.
export default function Practices() {
  const [practices, setPractices] = useState([]);
  const [open, setOpen] = useState(null);
  const [done, setDone] = useState({});

  useEffect(() => {
    api('/practices').then((d) => setPractices(d.practices));
  }, []);

  async function complete(id) {
    await api(`/practices/${id}/complete`, { method: 'POST' });
    setDone({ ...done, [id]: true });
  }

  return (
    <div className="screen">
      <h1>Practices</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Short guided rituals for daily growth.</p>
      {practices.map((p) => (
        <div key={p.id} className="card">
          <div className="row" style={{ justifyContent: 'space-between' }} onClick={() => setOpen(open === p.id ? null : p.id)}>
            <h3>{p.title}</h3>
            <span className="muted">{p.duration}</span>
          </div>
          <p className="muted">{p.category}</p>
          {open === p.id && (
            <>
              <p style={{ marginTop: 10 }}>{p.description}</p>
              <ol style={{ margin: '12px 0 0 18px', color: 'var(--charcoal-soft)', lineHeight: 1.8 }}>
                {p.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <button className="btn" disabled={done[p.id]} onClick={() => complete(p.id)}>
                {done[p.id] ? '✓ Completed' : 'Complete practice'}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
