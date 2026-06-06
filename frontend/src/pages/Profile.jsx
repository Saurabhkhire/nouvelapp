import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Screen 15: Profile / Settings.
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, logout, refresh } = useAuth();
  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');
  const [reminder, setReminder] = useState('08:00');
  const [notif, setNotif] = useState('on');
  const [areas, setAreas] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setIntention(profile?.intention || '');
    api('/results').then((d) => setAreas(d.focusAreas)).catch(() => {});
    api('/me').then((d) => { setReminder(d.user.reminder_time || '08:00'); setNotif(d.user.notification_pref || 'on'); });
  }, [user, profile]);

  async function save() {
    await api('/profile', { method: 'PUT', body: { name, intention } });
    await api('/settings', { method: 'PUT', body: { reminder_time: reminder, notification_pref: notif } });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="screen">
      <h1>Profile</h1>
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <label>Main intention</label>
      <input value={intention} onChange={(e) => setIntention(e.target.value)} />

      <label>Notifications</label>
      <select value={notif} onChange={(e) => setNotif(e.target.value)}>
        <option value="on">On</option>
        <option value="off">Off</option>
      </select>
      <label>Preferred reminder time</label>
      <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />

      <button className="btn" onClick={save}>{saved ? '✓ Saved' : 'Save changes'}</button>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="eyebrow">Saved results</div>
        {areas.map((a, i) => <p key={i} style={{ color: 'var(--charcoal)', marginTop: 6 }}>• {a.title}</p>)}
        <button className="btn secondary" onClick={() => navigate('/onboarding')}>Retake assessment</button>
      </div>

      <button className="btn secondary" onClick={() => { logout(); navigate('/welcome'); }}>Log out</button>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Your journal entries are private and stored securely. They are never shared publicly.
      </p>
    </div>
  );
}
