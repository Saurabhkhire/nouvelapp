import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSESSMENT_QUESTIONS, generateFocusAreas } from '../services/mockData.js';
import { offlineService } from '../services/offline.js';

export default function Assessment() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(ASSESSMENT_QUESTIONS);
  const [answers, setAnswers] = useState({});
  const [i, setI] = useState(0);
  const [error, setError] = useState('');

  if (error) return <div className="screen"><p className="error">{error}</p></div>;
  if (!questions.length) return <div className="screen center"><div className="glow" /></div>;

  const q = questions[i];
  const chosen = answers[q.id];
  const isLast = i === questions.length - 1;

  function choose(option) {
    setAnswers({ ...answers, [q.id]: option });
  }

  function next() {
    if (isLast) {
      navigate('/loading');
      try {
        const focusAreas = generateFocusAreas(answers);
        offlineService.setAssessment({ answers, focusAreas });
        const user = offlineService.getUser();
        user.assessmentCompleted = true;
        offlineService.setUser(user);
        sessionStorage.setItem('nouvel_results', JSON.stringify({ focusAreas }));
        navigate('/results');
      } catch (e) {
        setError(e.message);
        navigate('/assessment');
      }
    } else {
      setI(i + 1);
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
        <button className="btn" disabled={!chosen} onClick={next}>{isLast ? 'See My Results' : 'Continue'}</button>
      </div>
    </div>
  );
}