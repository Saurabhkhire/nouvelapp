import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { buildPersonalization } from '../personalize.js';

// Screen 6: Self-Mastery Assessment — one PRD question per screen.
export default function Assessment() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [i, setI] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/assessment/questions')
      .then((d) => setQuestions(d.questions))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="screen"><p className="error">{error}</p></div>;
  if (!questions.length) return <div className="screen center"><div className="glow" /></div>;

  const q = questions[i];
  const chosen = answers[q.id];
  const isLast = i === questions.length - 1;

  function choose(option) {
    setAnswers({ ...answers, [q.id]: option });
  }

  async function next() {
    if (!isLast) {
      setI(i + 1);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = questions.map((qq) => ({ questionId: qq.id, answer: answers[qq.id] }));
      const res = await api('/assessment/submit', { method: 'POST', body: { answers: payload } });

      // Cache results + the first prompt for the next screens (avoids a refetch).
      sessionStorage.setItem(
        'nouvel_results',
        JSON.stringify({ focusAreas: res.focusAreas, firstPrompt: res.firstPrompt })
      );
      // Personalized loading sequence — built from THIS user's answers, so every
      // person sees different lines and a different glow (PRD Screen 7).
      sessionStorage.setItem(
        'nouvel_loading',
        JSON.stringify(buildPersonalization(questions, answers, res.focusAreas))
      );
      navigate('/loading');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="eyebrow">{i + 1} of {questions.length}</div>
      <h2 style={{ marginBottom: 22 }}>{q.text}</h2>
      <div>
        {q.options.map((o) => (
          <button key={o} className={`option${chosen === o ? ' active' : ''}`} onClick={() => choose(o)}>
            {o}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        {i > 0 && <button className="btn secondary" onClick={() => setI(i - 1)}>Back</button>}
        <button className="btn" disabled={!chosen || busy} onClick={next}>
          {busy ? 'Creating your path…' : isLast ? 'See My Results' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
