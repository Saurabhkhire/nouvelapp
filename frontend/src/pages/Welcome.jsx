import { useNavigate } from 'react-router-dom';

// Screen 2: Welcome / emotional promise.
export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="screen center">
      <div className="logo" style={{ marginBottom: 30 }}>Nouvel</div>
      <h1>A guided space for self-mastery, clarity, and becoming.</h1>
      <p style={{ marginTop: 8 }}>
        Reflect, realign, and grow into the next version of yourself through personalized
        journaling and daily inner work.
      </p>
      <div style={{ width: '100%', marginTop: 36 }}>
        <button className="btn" onClick={() => navigate('/signup')}>Begin</button>
        <button className="btn secondary" onClick={() => navigate('/login')}>Log In</button>
      </div>
    </div>
  );
}
