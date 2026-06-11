import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Screen 10: Home Dashboard.
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, focusAreas } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [areas, setAreas] = useState(focusAreas || []);
  const [practice, setPractice] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api('/prompt/daily').then((d) => setPrompt(d.prompt)).catch(() => {});
    api('/me').then((d) => setAreas(d.focusAreas || [])).catch(() => {});
    api('/practices').then((d) => {
      const list = d.practices || [];
      if (list.length) setPractice(list[Math.floor(Math.random() * list.length)]);
    }).catch(() => {});
    api('/progress').then(setProgress).catch(() => {});
  }, []);

  return (
    <div className="screen">
      <div className="eyebrow">{greeting()}, {user?.name?.split(' ')[0] || 'friend'}</div>
      <h1>Today's focus: {areas[0]?.title?.split('&')[0]?.trim() || 'Emotional clarity'}</h1>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Today's prompt</div>
        <p className="serif" style={{ fontSize: 18, color: 'var(--charcoal)' }}>{prompt || '…'}</p>
        <button className="btn" onClick={() => navigate('/journal', { state: { prompt } })}>Journal on this</button>
      </div>

      {practice && (
        <div className="card">
          <div className="eyebrow">Daily practice</div>
          <h3>{practice.title}</h3>
          <p className="muted">{practice.duration} · {practice.category}</p>
          <button className="btn secondary" onClick={() => navigate('/practices')}>Begin practice</button>
        </div>
      )}

      <div className="card">
        <div className="eyebrow">Your focus areas</div>
        {areas.map((a, i) => (
          <p key={i} style={{ color: 'var(--charcoal)', marginTop: 6 }}>• {a.title}</p>
        ))}
      </div>

      {progress && (
        <div className="card">
          <div className="eyebrow">Progress snapshot</div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="stat"><div className="num">{progress.streak}</div><div className="lbl">DAY STREAK</div></div>
            <div className="stat"><div className="num">{progress.entryCount}</div><div className="lbl">ENTRIES</div></div>
            <div className="stat"><div className="num">{progress.completedPractices}</div><div className="lbl">PRACTICES</div></div>
          </div>
          <button className="btn secondary" onClick={() => navigate('/progress')}>View progress</button>
        </div>
      )}
    </div>
  );
}
