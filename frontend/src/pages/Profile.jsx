import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Screen 15: Profile / Settings.
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, logout, deleteAccount, refresh } = useAuth();
  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');
  const [reminder, setReminder] = useState('08:00');
  const [notif, setNotif] = useState('on');
  const [areas, setAreas] = useState([]);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setIntention(profile?.intention || '');
    api('/me').then((d) => {
      setReminder(d.user.reminder_time || '08:00');
      setNotif(d.user.notification_pref || 'on');
      setAreas(d.focusAreas || []);
    }).catch(() => {});
  }, [user, profile]);

  async function save() {
    await api('/profile', { method: 'PUT', body: { name, intention } });
    await api('/settings', { method: 'PUT', body: { reminder_time: reminder, notification_pref: notif } });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      navigate('/welcome', { replace: true });
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
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
        {areas.length
          ? areas.map((a, i) => <p key={i} style={{ color: 'var(--charcoal)', marginTop: 6 }}>• {a.title}</p>)
          : <p className="muted" style={{ marginTop: 6 }}>Take the assessment to see your focus areas.</p>}
        <button className="btn secondary" onClick={() => navigate('/onboarding')}>Retake assessment</button>
      </div>

      <button className="btn secondary" onClick={() => { logout(); navigate('/welcome'); }}>Log out</button>

      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Your journal entries are private and stored securely. They are never shared publicly.
      </p>

      {/* Danger zone — permanent account deletion (PRD §8 privacy / right to erasure). */}
      <div className="card" style={{ marginTop: 22, borderColor: '#e3c7bf' }}>
        <div className="eyebrow" style={{ color: '#a4503f' }}>Danger zone</div>
        {!confirmDelete ? (
          <>
            <p className="muted" style={{ marginBottom: 4 }}>
              Permanently delete your account and all journal entries, results, and progress. This cannot be undone.
            </p>
            <button className="btn danger" onClick={() => setConfirmDelete(true)}>Delete account</button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--charcoal)', marginBottom: 4 }}>
              Are you sure? This will erase everything for <strong>{user?.email}</strong> and cannot be undone.
            </p>
            {error && <div className="error">{error}</div>}
            <button className="btn danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Yes, delete my account permanently'}
            </button>
            <button className="btn secondary" disabled={deleting} onClick={() => setConfirmDelete(false)}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
