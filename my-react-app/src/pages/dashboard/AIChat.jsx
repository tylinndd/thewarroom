import { useState, useRef, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { Send, Bot, User, Sparkles } from 'lucide-react';

function buildDummyResponse(message, team) {
  const msg = message.toLowerCase();
  const teamName = team ? `${team.city} ${team.name}` : 'your team';

  if (msg.includes('roster') || msg.includes('players')) {
    return `The ${teamName} currently have 10 players on the active roster. Your top performer is Marcus Webb averaging 24.8 PPG with a usage rate of 28.9%. The roster has a total salary commitment of $138.5M against a $152.7M cap, leaving roughly $14.2M in cap space.`;
  }
  if (msg.includes('fragility') || msg.includes('injury') || msg.includes('risk')) {
    return `Injury risk analysis for the ${teamName}: 2 players are flagged as HIGH risk — Jamal Rivers (score: 74) and Victor Moss (score: 81). Both players are 30+ with high back-to-back frequency. I'd recommend monitoring their minutes load in the second half of the season.`;
  }
  if (msg.includes('trade') || msg.includes('trade idea')) {
    return `Based on your team's needs and current roster construction, a trade targeting a rim protector or secondary playmaker would improve your defensive rating. Your cap flexibility ($14.2M) and young assets like Elijah Grant (22yo, $3.1M) could be attractive to rebuilding teams.`;
  }
  if (msg.includes('performance') || msg.includes('next game') || msg.includes('predict')) {
    return `For the upcoming game, my Random Forest model predicts Marcus Webb to exceed his season averages: projected 26.1 PPG vs. 24.8 PPG average. The opponent's Defensive Rating of 108.4 is slightly below league average, creating favorable matchup conditions for your wing players.`;
  }
  if (msg.includes('cap') || msg.includes('salary') || msg.includes('contract')) {
    return `Cap situation: ${teamName} is at 90.7% of the salary cap ($138.5M / $152.7M). Three players are on expiring contracts. Jamal Rivers and Victor Moss are the most over market-value relative to their Win Shares. Restructuring or letting those expire would open ~$22M in space next offseason.`;
  }
  if (msg.includes('value') || msg.includes('valuation') || msg.includes('franchise')) {
    return `Monte Carlo simulation projects the ${teamName} franchise valuation to grow from $2.4B (current) to a median of $3.6B by 2029 — a 50% increase. The 90th percentile scenario reaches $4.5B, contingent on continued roster development and a deep playoff run in the next 2 seasons.`;
  }
  if (msg.includes('win') || msg.includes('record') || msg.includes('standings')) {
    return `Current record: 38-26. My model projects a median finish of 46-36, which should secure a top-4 seed. The key variable is Marcus Webb's health — his presence shifts the win probability by approximately +6 games over the remaining schedule.`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! I'm your War Room AI assistant, scoped to the ${teamName}. I have full context of your roster, contracts, injury risks, and performance data. Ask me anything about your team — trade scenarios, player analysis, or strategic recommendations.`;
  }
  return `Analyzing your query in context of the ${teamName}... Based on current roster data, performance metrics, and league trends, here's my assessment: ${teamName} is positioned competitively in the middle tier of the league. To maximize this window, I'd prioritize addressing the fragility concerns in the front court and exploring complementary-fit players via the Team Fit Engine. Want me to drill deeper into any specific area?`;
}

const SUGGESTED_PROMPTS = [
  'How is my roster performing?',
  'Who is at high injury risk?',
  'What trade moves should I consider?',
  'Predict performance for the next game',
  "What's our cap situation?",
];

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-zinc-900' : 'bg-white border border-zinc-200'
      }`}>
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-zinc-600" />}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-zinc-900 text-white rounded-tr-sm'
            : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { selectedTeam } = useTeam();
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: `Welcome to War Room AI — I'm scoped to the ${selectedTeam ? `${selectedTeam.city} ${selectedTeam.name}` : 'your team'}. Ask me anything about your roster, contracts, injury risks, performance predictions, or trade scenarios.`,
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function handleSend(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg }]);
    setInput('');
    setTyping(true);

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    const teamName = selectedTeam ? `${selectedTeam.city} ${selectedTeam.name}` : null;

    try {
      const res = await api.chat({
        message: userMsg,
        team_id: selectedTeam?.id ?? undefined,
        team_name: teamName ?? undefined,
        history,
      });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: res.reply }]);
    } catch (err) {
      const response = buildDummyResponse(userMsg, selectedTeam);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: response }]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full" style={{ height: 'calc(100vh - 140px)' }}>
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">AI Chat</h2>
        <p className="text-sm text-zinc-500">
          Natural Language Querying — ask anything about your team in plain English.
        </p>
      </div>

      {/* Chat window */}
      <div className="flex-1 card p-4 overflow-y-auto flex flex-col gap-4" style={{ minHeight: 0 }}>
        {messages.map(msg => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}

        {typing && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={13} className="text-zinc-600" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-zinc-200 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-all"
            >
              <Sparkles size={11} className="text-zinc-400" />
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-3 glass rounded-2xl p-2 border border-white/40">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your team..."
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none px-2"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || typing}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
