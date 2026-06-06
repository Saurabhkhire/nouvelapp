import { useNavigate } from 'react-router-dom';

// Screen 5: Onboarding introduction.
export default function OnboardingIntro() {
  const navigate = useNavigate();
  return (
    <div className="screen center">
      <div className="glow" />
      <h1>Let’s understand where you are right now.</h1>
      <p style={{ marginTop: 8 }}>
        Your answers will help Nouvel personalize your journaling prompts, focus areas, and
        daily practices.
      </p>
      <div style={{ width: '100%', marginTop: 30 }}>
        <button className="btn" onClick={() => navigate('/assessment')}>Start Assessment</button>
      </div>
    </div>
  );
}
