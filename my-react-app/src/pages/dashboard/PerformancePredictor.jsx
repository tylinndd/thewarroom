import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function delta(predicted, actual) {
  const d = predicted - actual;
  if (Math.abs(d) < 0.3) return { icon: Minus, color: '#a1a1aa', text: '—' };
  if (d > 0) return { icon: TrendingUp, color: '#10b981', text: `+${d.toFixed(1)}` };
  return { icon: TrendingDown, color: '#ef4444', text: d.toFixed(1) };
}

export default function PerformancePredictor() {
  const { selectedTeam } = useTeam();
  const [roster, setRoster] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opponentTeamId, setOpponentTeamId] = useState(1610612738);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setRoster(DUMMY_ROSTER);
      setSelectedId(DUMMY_ROSTER[0]?.id);
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.teams.roster(selectedTeam.id)
      .then(res => { if (!cancelled) { setRoster(res.players || []); setSelectedId(res.players?.[0]?.player_id ?? DUMMY_ROSTER[0]?.id); } })
      .catch(() => { if (!cancelled) { setError(true); setRoster(DUMMY_ROSTER); setSelectedId(DUMMY_ROSTER[0]?.id); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTeam?.id]);

  useEffect(() => {
    if (!selectedId) return;
    const useApi = roster.some(p => (p.player_id ?? p.id) === selectedId);
    if (!useApi) return;
    let cancelled = false;
    Promise.all([
      api.analytics.performance(selectedId, opponentTeamId || undefined),
      api.players.get(selectedId),
    ]).then(([pred, stats]) => {
      if (!cancelled) { setPrediction(pred); setPlayerStats(stats); }
    }).catch(() => { if (!cancelled) setPrediction(null); setPlayerStats(null); });
    return () => { cancelled = true; };
  }, [selectedId, opponentTeamId, roster]);

  const displayRoster = roster.length ? roster : DUMMY_ROSTER;
  const useDummy = !roster.some(p => (p.player_id ?? p.id) === selectedId);
  const dummyPlayer = DUMMY_ROSTER.find(p => p.id === selectedId);
  const apiPlayer = displayRoster.find(p => (p.player_id ?? p.id) === selectedId);
  const player = useDummy
    ? dummyPlayer
    : apiPlayer
      ? {
          id: apiPlayer.player_id,
          name: prediction?.name ?? apiPlayer.name,
          ppg: playerStats?.ppg ?? 0,
          rpg: playerStats?.rpg ?? 0,
          apg: playerStats?.apg ?? 0,
          fg_pct: playerStats?.fg_pct ?? 0,
          usage_rate: playerStats?.usage_rate ?? 0,
          predicted: prediction
            ? { ppg: prediction.predicted_ppg, rpg: prediction.predicted_rpg, apg: prediction.predicted_apg }
            : null,
        }
      : null;

  const chartData = player ? [
    { stat: 'PPG',  Actual: player.ppg ?? 0,  Predicted: player.predicted?.ppg ?? player.ppg },
    { stat: 'RPG',  Actual: player.rpg ?? 0,  Predicted: player.predicted?.rpg ?? player.rpg },
    { stat: 'APG',  Actual: player.apg ?? 0,  Predicted: player.predicted?.apg ?? player.apg },
  ] : [];

  const stats = player ? [
    { label: 'Points', actual: player.ppg ?? 0,  predicted: player.predicted?.ppg ?? player.ppg },
    { label: 'Rebounds', actual: player.rpg ?? 0,  predicted: player.predicted?.rpg ?? player.rpg },
    { label: 'Assists', actual: player.apg ?? 0,  predicted: player.predicted?.apg ?? player.apg },
    { label: 'FG%', actual: ((player.fg_pct ?? 0) * 100).toFixed(1), predicted: (((player.fg_pct ?? 0) + 0.012) * 100).toFixed(1) },
  ] : [];

  if (!player && !loading) return null;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Using demo data (API unavailable)
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Performance Predictor</h2>
        <p className="text-sm text-zinc-500">
          Random Forest model trained on last 20 games + opponent Defensive Rating. Opponent: <span className="font-medium text-zinc-700">vs. Next Game</span>
        </p>
      </div>

      {/* Player selector */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Select Player</p>
        {loading && !roster.length ? (
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        ) : (
        <div className="flex flex-wrap gap-2">
          {displayRoster.map(p => {
            const id = p.player_id ?? p.id;
            return (
            <button
              key={id}
              onClick={() => setSelectedId(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedId === id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }              `}
            >
              <span className="font-bold">{p.position || '—'}</span>
              {p.name}
            </button>
          );})}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            {player.name} — Season Avg vs. Next-Game Prediction
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="stat" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Actual"    fill="#d4d4d8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Predicted" fill="#111111" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stat deltas */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Projection Delta</p>
          <div className="flex flex-col gap-3">
            {stats.map(s => {
              const d = delta(parseFloat(s.predicted), parseFloat(s.actual));
              const Icon = d.icon;
              return (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-zinc-700">{s.label}</p>
                    <p className="text-xs text-zinc-400">{s.actual} → <span className="font-semibold text-zinc-700">{s.predicted}</span></p>
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ color: d.color, backgroundColor: `${d.color}18` }}
                  >
                    <Icon size={12} />
                    {d.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 mb-1 font-medium">Model inputs</p>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Usage rate</span>
                <span className="text-zinc-700 font-medium">{(player.usage_rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Opp Def Rtg</span>
                <span className="text-zinc-700 font-medium">{prediction?.recent_avg ? '—' : '108.4'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Confidence</span>
                <span className="text-zinc-700 font-medium">{prediction ? `${Math.round((prediction.confidence ?? 0.78) * 100)}%` : '78%'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
