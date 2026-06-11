// Builds the personalized Loading/Personalization screen content (PRD Screen 7)
// from THIS user's assessment answers. Every person answers differently, so the
// phrases and the glow they see while results generate are unique to them.

// Glow variants (see styles.css .glow--*). Chosen from how they want to feel daily.
const FEELING_VARIANT = {
  Peaceful: 'peace',
  Powerful: 'power',
  Clear: 'clarity',
  Grounded: 'ground',
  Inspired: 'inspire',
  'Emotionally safe': 'safe',
};

const stripMore = (s) => s.replace(/^More\s+/i, '');
const lower = (s) => (s ? s.toLowerCase() : s);

// Find a question's chosen answer by matching a keyword in its text. Robust to
// id/order changes coming from the backend.
function answerFor(questions, answers, keyword) {
  const q = questions.find((x) => x.text.toLowerCase().includes(keyword));
  return q ? answers[q.id] : null;
}

export function buildPersonalization(questions, answers, focusAreas = []) {
  const unclear = answerFor(questions, answers, 'unclear');
  const desire = answerFor(questions, answers, 'desire most');
  const pattern = answerFor(questions, answers, 'pattern');
  const feeling = answerFor(questions, answers, 'feel daily');
  const becoming = answerFor(questions, answers, 'becoming');

  const phases = ['Creating your personalized path…'];
  if (unclear) phases.push(`Holding space for what feels unclear — ${lower(unclear)}…`);
  if (desire) phases.push(`Hearing your desire for ${lower(stripMore(desire))}…`);
  phases.push('Understanding your current season…');
  if (pattern) phases.push(`Honoring the pattern you’re ready to release — ${lower(pattern)}…`);
  if (feeling) phases.push(`Tuning your days toward feeling ${lower(feeling)}…`);
  if (becoming) phases.push(`Witnessing who you’re becoming — ${lower(becoming)}…`);
  phases.push('Curating your focus areas…');
  if (focusAreas[0]?.title) phases.push(`Aligning around ${focusAreas[0].title}…`);

  // De-duplicate while preserving order.
  const seen = new Set();
  const unique = phases.filter((p) => (seen.has(p) ? false : seen.add(p)));

  const variant = FEELING_VARIANT[feeling] || 'peace';
  return { phases: unique, variant };
}
