import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';
import MoodPicker from './MoodPicker.jsx';

// Screen 11: Journal — write entries and browse past ones.
export default function Journal() {
  const location = useLocation();
  const [view, setView] = useState('write');
  const [prompt] = useState(location.state?.prompt || '');
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  const [reflect, setReflect] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');

  function load() {
    const q = filter ? `?theme=${encodeURIComponent(filter)}` : '';
    api(`/journal${q}`).then((d) => setEntries(d.entries)).catch((e) => setError(e.message));
  }
  useEffect(() => { load(); }, [filter]);

  async function save() {
    setError('');
    if (!text.trim()) { setError('Your entry cannot be empty.'); return; }
    setBusy(true);
    try {
      await api('/journal', {
        method: 'POST',
        body: {
          prompt_text: prompt,
          journal_text: text,
          mood_before: moodBefore,
          mood_after: moodAfter,
          tags,
          reflect,
        },
      });
      setText('');
      setTags('');
      setMoodBefore('');
      setMoodAfter('');
      setView('history');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleFav(id) {
    await api(`/journal/${id}/favorite`, { method: 'PATCH' });
    load();
  }

  return (
    <div className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Journal</h1>
        <button className="link" onClick={() => setView(view === 'write' ? 'history' : 'write')}>
          {view === 'write' ? 'View past entries' : 'New entry'}
        </button>
      </div>
      {view === 'write' ? (
        <>
          {prompt && <div className="card"><p className="serif" style={{ color: 'var(--charcoal)' }}>{prompt}</p></div>}
          <MoodPicker label="Mood before" value={moodBefore} onChange={setMoodBefore} />
          <label>Your reflection</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write freely…" />
          <label>Themes (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. boundaries, clarity" />
          <MoodPicker label="Mood after" value={moodAfter} onChange={setMoodAfter} />
          <label className="row" style={{ marginTop: 14, gap: 8 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={reflect} onChange={(e) => setReflect(e.target.checked)} />
            <span style={{ color: 'var(--charcoal-soft)' }}>Include a gentle AI reflection</span>
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save entry'}</button>
        </>
      ) : (
        <>
          <input style={{ marginTop: 14 }} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by theme…" />
          {entries.length === 0 && <p className="muted" style={{ marginTop: 20 }}>No entries yet. Your reflections will live here.</p>}
          {entries.map((e) => (
            <div key={e.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{new Date(e.created_at).toLocaleDateString()}</span>
                <button className="link" onClick={() => toggleFav(e.id)}>{e.favorite ? '★ Favorited' : '☆ Favorite'}</button>
              </div>
              {e.prompt_text && <p className="muted" style={{ fontStyle: 'italic', marginTop: 6 }}>{e.prompt_text}</p>}
              <p style={{ color: 'var(--charcoal)', marginTop: 8 }}>{e.journal_text}</p>
              {(e.mood_before || e.mood_after) && (
                <p className="muted" style={{ marginTop: 6 }}>{e.mood_before} → {e.mood_after}</p>
              )}
              {e.tags && <div style={{ marginTop: 6 }}>{e.tags.split(',').map((t) => <span key={t} className="tag">{t.trim()}</span>)}</div>}
              {e.ai_reflection && <div className="card" style={{ marginTop: 10, background: 'var(--beige)' }}><p style={{ fontSize: 13 }}>✺ {e.ai_reflection}</p></div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
