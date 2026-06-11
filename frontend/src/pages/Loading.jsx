import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_PHASES = [
  'Creating your personalized path…',
  'Understanding your current season…',
  'Curating your focus areas…',
];

const PHASE_MS = 1500;

// Screen 7: Loading / Personalization. When reached from the assessment it plays
// a sequence of lines built from the user's own answers (different for everyone),
// shows a glow tuned to how they want to feel, then advances to their results.
// Used elsewhere (e.g. session restore) it simply breathes with the given label.
export default function Loading({ label }) {
  const navigate = useNavigate();
  const location = useLocation();
  const onLoadingRoute = location.pathname === '/loading';

  const data = (() => {
    if (!onLoadingRoute) return null;
    try {
      return JSON.parse(sessionStorage.getItem('nouvel_loading'));
    } catch {
      return null;
    }
  })();

  const phases = data?.phases?.length ? data.phases : onLoadingRoute ? DEFAULT_PHASES : null;
  const variant = data?.variant || 'peace';
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Off-route (session restore): gently cycle the default trio, no navigation.
    if (!onLoadingRoute) {
      const t = setInterval(() => setPhase((p) => (p + 1) % DEFAULT_PHASES.length), PHASE_MS);
      return () => clearInterval(t);
    }
    // On the loading route: step once through the personalized phases, then go on.
    if (phase >= phases.length - 1) {
      const done = setTimeout(() => {
        sessionStorage.removeItem('nouvel_loading');
        navigate('/results', { replace: true });
      }, PHASE_MS);
      return () => clearTimeout(done);
    }
    const t = setTimeout(() => setPhase((p) => p + 1), PHASE_MS);
    return () => clearTimeout(t);
  }, [phase, onLoadingRoute]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = onLoadingRoute ? phases[phase] : label || DEFAULT_PHASES[phase];

  return (
    <div className="screen center">
      <div className={`glow glow--${variant}`} />
      <p className="serif" style={{ fontSize: 20, transition: 'opacity 0.4s' }} key={text}>
        {text}
      </p>
    </div>
  );
}
