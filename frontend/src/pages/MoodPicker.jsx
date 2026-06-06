const MOODS = ['anxious', 'tired', 'neutral', 'hopeful', 'calm', 'grounded', 'inspired', 'peaceful'];

// Optional mood selector (PRD Screen 9 & 11).
export default function MoodPicker({ label, value, onChange }) {
  return (
    <div style={{ marginTop: 14 }}>
      {label && <label style={{ margin: '0 0 6px' }}>{label}</label>}
      <div className="moods">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            className={`mood${value === m ? ' active' : ''}`}
            onClick={() => onChange(value === m ? '' : m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
