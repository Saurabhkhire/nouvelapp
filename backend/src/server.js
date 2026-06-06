import 'dotenv/config';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  const mode = process.env.OPENAI_API_KEY ? 'OpenAI' : 'rule-based fallback';
  console.log(`Nouvel backend listening on http://localhost:${PORT} (AI: ${mode})`);
});
