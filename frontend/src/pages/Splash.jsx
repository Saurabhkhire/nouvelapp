import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Screen 1: brand splash. Routes the user onward once auth state is known.
export default function Splash() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!user) navigate('/welcome');
      else if (!profile?.assessment_completed) navigate('/profile-setup');
      else navigate('/home');
    }, 1600);
    return () => clearTimeout(t);
  }, [loading, user, profile, navigate]);

  return (
    <div className="screen center">
      <div className="glow" />
      <div className="logo">Nouvel</div>
      <p className="muted" style={{ marginTop: 14 }}>Return to yourself.</p>
    </div>
  );
}
