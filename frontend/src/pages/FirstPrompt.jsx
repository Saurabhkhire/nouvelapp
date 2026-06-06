import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import MoodPicker from './MoodPicker.jsx';

// Screen 9: first personalized journaling prompt.
export default function FirstPrompt() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem('nouvel_results');
    if (cached) setPrompt(JSON.parse(cached).firstPrompt || '');
    else api('/prompt/daily').then((d) => setPrompt(d.prompt));
  }, []);

  async function save() {
    setBusy(true);
    await api('/journal', {
      method: 'POST',
      body: { prompt_text: prompt, journal_text: text, mood_before: moodBefore, mood_after: moodAfter },
    });
    sessionStorage.removeItem('nouvel_results');
    navigate('/home');
  }

  return (
    <div className="screen">
      <div className="eyebrow">Your first reflection</div>
      <div className="card"><p className="serif" style={{ fontSize: 18, color: 'var(--charcoal)' }}>{prompt}</p></div>
      <MoodPicker label="How do you feel before writing?" value={moodBefore} onChange={setMoodBefore} />
      <label>Your reflection</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Let it flow…" />
      <MoodPicker label="How do you feel after?" value={moodAfter} onChange={setMoodAfter} />
      <button className="btn" disabled={busy || !text.trim()} onClick={save}>
        {busy ? 'Saving…' : 'Save & Continue'}
      </button>
    </div>
  );
}
