import { useEffect, useState } from 'react';

const PHASES = [
  'Creating your personalized path…',
  'Understanding your current season…',
  'Curating your focus areas…',
];

// Screen 7: personalization / loading screen with a breathing glow.
export default function Loading({ label }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="screen center">
      <div className="glow" />
      <p className="serif" style={{ fontSize: 20 }}>{label || PHASES[phase]}</p>
    </div>
  );
}
