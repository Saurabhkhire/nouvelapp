import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Screen 4: Profile Setup (PRD §6).
const SEASONS = [
  'I am rebuilding myself',
  'I am ready to grow',
  'I am seeking clarity',
  'I am entering a new chapter',
  'I want emotional balance',
  'I want to become more disciplined',
  'I want to reconnect with myself',
];
const AGES = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [ageRange, setAgeRange] = useState('25-34');
  const [season, setSeason] = useState('');
  const [intention, setIntention] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api('/profile', {
        method: 'PUT',
        body: { age_range: ageRange, life_season: season, intention },
      });
      await refresh();
      navigate('/onboarding');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="eyebrow">Personalize Nouvel</div>
      <h1>Let's set the tone.</h1>
      <label>Age range</label>
      <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
        {AGES.map((a) => <option key={a}>{a}</option>)}
      </select>

      <label>Your current life season</label>
      <div>
        {SEASONS.map((s) => (
          <button key={s} className={`option${season === s ? ' active' : ''}`} onClick={() => setSeason(s)}>
            {s}
          </button>
        ))}
      </div>

      <label>Your main intention for using Nouvel</label>
      <input value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="e.g. Feel more grounded and clear" />

      {error && <div className="error">{error}</div>}
      <button className="btn" disabled={busy || !season} onClick={save}>
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </div>
  );
}
