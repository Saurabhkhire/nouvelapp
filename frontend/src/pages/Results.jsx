import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

// Screen 8: personalized results — always exactly 3 focus areas.
export default function Results() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    const cached = sessionStorage.getItem('nouvel_results');
    if (cached) {
      setAreas(JSON.parse(cached).focusAreas);
    } else {
      api('/results').then((d) => setAreas(d.focusAreas));
    }
  }, []);

  if (!areas) return <div className="screen center"><div className="glow" /></div>;

  return (
    <div className="screen">
      <div className="eyebrow">Your reflection</div>
      <h1>Your Current Self-Mastery Focus</h1>
      <p style={{ marginBottom: 24 }}>
        Based on your answers, Nouvel has identified the areas that may support your next level
        of growth, clarity, and emotional alignment.
      </p>
      {areas.map((a, idx) => (
        <div key={idx} className="focus">
          <h3>{idx + 1}. {a.title}</h3>
          <p>{a.desc}</p>
        </div>
      ))}
      <button className="btn" onClick={() => navigate('/first-prompt')}>Begin My First Prompt</button>
      <button className="btn secondary" onClick={() => navigate('/home')}>Save My Results</button>
    </div>
  );
}
