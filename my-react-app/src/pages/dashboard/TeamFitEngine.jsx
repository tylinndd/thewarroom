import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { DUMMY_ROSTER, FREE_AGENT_POOL } from '../../data/dummyRoster';
import { Loader2 } from 'lucide-react';
import { Check, Search, Users } from 'lucide-react';

// Backend expects: pace, three_point, defense, rebounding, playmaking (0-1 weights)
const IDENTITIES = [
  {
    id: 'pace',
    label: 'Pace & Space',
    desc: 'High pace, perimeter shooting, open floor',
    weights: { pace: 1.2, three_point: 1.4, defense: 0.6, rebounding: 0.8, playmaking: 1.0 },
    clientWeights: { three_pct: 0.4, usage_rate: 0.15, mpg: 0.1, fg_pct: 0.2, apg: 0.15 },
  },
  {
    id: 'defensive',
    label: 'Defensive Wall',
    desc: 'Rim protection, switchability, low turnovers',
    weights: { pace: 0.8, three_point: 0.6, defense: 1.4, rebounding: 1.2, playmaking: 0.6 },
    clientWeights: { rpg: 0.4, mpg: 0.2, fg_pct: 0.25, usage_rate: 0.1, apg: 0.05 },
  },
  {
    id: 'playmaking',
    label: 'Playmaking Hub',
    desc: 'Ball movement, high assists, read-and-react offense',
    weights: { pace: 1.0, three_point: 1.0, defense: 0.8, rebounding: 0.6, playmaking: 1.4 },
    clientWeights: { apg: 0.45, usage_rate: 0.2, three_pct: 0.15, fg_pct: 0.1, mpg: 0.1 },
  },
  {
    id: 'iso',
    label: 'ISO / Star-Led',
    desc: 'High usage, scoring volume, hero ball',
    weights: { pace: 0.9, three_point: 0.8, defense: 0.7, rebounding: 0.8, playmaking: 1.2 },
    clientWeights: { ppg: 0.45, usage_rate: 0.3, fg_pct: 0.15, three_pct: 0.05, mpg: 0.05 },
  },
  {
    id: 'balanced',
    label: 'Balanced Attack',
    desc: 'Even distribution of scoring, rebounding, and assists',
    weights: { pace: 1.0, three_point: 1.0, defense: 1.0, rebounding: 1.0, playmaking: 1.0 },
    clientWeights: { ppg: 0.2, rpg: 0.2, apg: 0.2, fg_pct: 0.2, three_pct: 0.2 },
  },
];

function cosineSimilarity(player, weights) {
  const maxes = { ppg: 30, rpg: 12, apg: 10, three_pct: 0.5, fg_pct: 0.65, usage_rate: 0.4, mpg: 40 };
  let score = 0;
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const val = player[key] || 0;
    const norm = Math.min(1, val / (maxes[key] || 1));
    score += norm * weight;
    total += weight;
  }
  return Math.round((score / total) * 100);
}

function SimilarityBar({ value }) {
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#3b82f6' : '#a1a1aa';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function TeamFitEngine() {
  const { selectedTeam } = useTeam();
  const [identityId, setIdentityId] = useState('pace');
  const [query, setQuery] = useState('');
  const [apiMatches, setApiMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const identity = IDENTITIES.find(i => i.id === identityId);

  useEffect(() => {
    if (!selectedTeam?.id) return;
    setLoading(true);
    setError(null);
    api.teamFit.search({
      team_identity: identity.weights,
      exclude_team_id: selectedTeam.id,
      top_n: 15,
    })
      .then(res => { setApiMatches(res.matches || []); })
      .catch(() => { setError(true); setApiMatches([]); })
      .finally(() => setLoading(false));
  }, [selectedTeam?.id, identityId, identity.weights]);

  const allPlayers = [...DUMMY_ROSTER, ...FREE_AGENT_POOL];
  const filtered = allPlayers.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.position.toLowerCase().includes(query.toLowerCase())
  );

  const useApi = selectedTeam?.id && apiMatches.length > 0 && !error;
  const rankedList = useApi
    ? apiMatches.map(m => ({
        id: m.player_id,
        player_id: m.player_id,
        name: m.player_name,
        position: m.stats?.position ?? '—',
        ppg: m.stats?.ppg ?? 0,
        rpg: m.stats?.rpg ?? 0,
        apg: m.stats?.apg ?? 0,
        similarity: Math.round((m.similarity ?? 0) * 100),
        team_id: m.team_id,
      }))
    : filtered.map(p => ({ ...p, similarity: cosineSimilarity(p, identity.clientWeights) })).sort((a, b) => b.similarity - a.similarity);
  const ranked = rankedList;

  const myRoster = new Set(DUMMY_ROSTER.map(p => p.id));

  return (
    <div className="flex flex-col gap-6">
      {error && selectedTeam?.id && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Using local similarity (API unavailable)
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Team Fit Engine</h2>
        <p className="text-sm text-zinc-500">
          Select a team identity — pgvector cosine similarity ranks every player by how well they fit your system.
        </p>
      </div>

      {/* Identity chips */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Team Identity</p>
        <div className="flex flex-wrap gap-2">
          {IDENTITIES.map(id => (
            <button
              key={id.id}
              onClick={() => setIdentityId(id.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                identityId === id.id
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {identityId === id.id && <Check size={11} />}
              {id.label}
            </button>
          ))}
        </div>
        {identity && (
          <p className="mt-3 text-xs text-zinc-400 italic">{identity.desc}</p>
        )}
        {loading && selectedTeam?.id && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Searching pgvector...
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter players by name or position..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ranked.map((player, idx) => (
          <div
            key={player.id}
            className={`card p-4 flex flex-col gap-3 ${idx < 3 ? 'ring-1 ring-zinc-200' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 w-4">#{idx + 1}</span>
                  <p className="text-sm font-semibold text-zinc-900">{player.name}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 ml-6">
                  <span className="text-xs text-zinc-400">{player.position}</span>
                  {myRoster.has(player.id) ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">On Roster</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Free Agent</span>
                  )}
                </div>
              </div>
            </div>

            <SimilarityBar value={player.similarity} />

            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: 'PPG', val: player.ppg },
                { label: 'RPG', val: player.rpg },
                { label: 'APG', val: player.apg },
              ].map(s => (
                <div key={s.label} className="bg-zinc-50 rounded-lg py-1.5">
                  <p className="text-xs font-bold text-zinc-900">{s.val}</p>
                  <p className="text-xs text-zinc-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {ranked.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Users size={32} className="mb-3 opacity-30" />
          <p className="text-sm">No players match your filter.</p>
        </div>
      )}
    </div>
  );
}
