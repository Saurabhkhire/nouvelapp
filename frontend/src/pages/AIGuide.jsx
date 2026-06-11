import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';

// Screen 12: AI Guide — a grounded reflective companion (PRD §6/§8).
export default function AIGuide() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'I\'m here with you. What feels most present for you right now?' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const { reply } = await api('/ai/guide', { method: 'POST', body: { message: text, history } });
      setMessages((m) => [...m, { role: 'ai', content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', content: 'I had trouble responding just now. Take a breath, and try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <h1>AI Guide</h1>
      <p className="muted" style={{ marginBottom: 16 }}>A grounded space to reflect. Not a replacement for therapy or crisis care.</p>
      <div className="chat">
        {messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.content}</div>)}
        {busy && <div className="bubble ai">…</div>}
        <div ref={endRef} />
      </div>
      <div className="row">
        <textarea
          style={{ minHeight: 54 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Share what's on your mind…"
        />
      </div>
      <button className="btn" disabled={busy || !input.trim()} onClick={send}>Send</button>
    </div>
  );
}
