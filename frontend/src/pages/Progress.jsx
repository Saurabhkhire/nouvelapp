import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Screen 14: Progress — growth over time.
export default function Progress() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    api('/progress').then(setData);
    api('/progress/weekly-summary').then((d) => setSummary(d.summary));
  }, []);

  if (!data) return <div className="screen center"><div className="glow" /></div>;

  return (
    <div className="screen">
      <h1>Your growth</h1>
      <div className="card">
        <div className="row">
          <div className="stat"><div className="num">{data.streak}</div><div className="lbl">DAY STREAK</div></div>
          <div className="stat"><div className="num">{data.entryCount}</div><div className="lbl">ENTRIES</div></div>
          <div className="stat"><div className="num">{data.completedPractices}</div><div className="lbl">PRACTICES</div></div>
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">Most common themes</div>
        {data.topThemes.length ? data.topThemes.map((t) => <span key={t} className="tag">{t}</span>)
          : <p className="muted">Add themes to your entries to see patterns here.</p>}
      </div>

      <div className="card">
        <div className="eyebrow">Mood trend</div>
        {data.moodTrend.length ? (
          <p style={{ color: 'var(--charcoal)' }}>{data.moodTrend.join('  →  ')}</p>
        ) : <p className="muted">Track moods with your entries to see your trend.</p>}
      </div>

      <div className="card">
        <div className="eyebrow">Weekly reflection summary</div>
        <p style={{ color: 'var(--charcoal)' }}>{summary || '…'}</p>
      </div>
    </div>
  );
}
