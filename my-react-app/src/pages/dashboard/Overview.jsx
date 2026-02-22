import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { DUMMY_ROSTER, DUMMY_TEAM_STATS } from '../../data/dummyRoster';
import { TrendingUp, DollarSign, AlertTriangle, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const RECENT_GAMES = [
  { game: 'G58', score: 118 }, { game: 'G59', score: 104 }, { game: 'G60', score: 122 },
  { game: 'G61', score: 111 }, { game: 'G62', score: 119 }, { game: 'G63', score: 98 },
  { game: 'G64', score: 125 },
];

function StatCard({ icon: Icon, label, value, sub, accent, to }) {
  const navigate = useNavigate();
  return (
    <div
      className={`card p-5 flex flex-col gap-3 ${to ? 'cursor-pointer' : ''}`}
      onClick={to ? () => navigate(to) : undefined}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        {to && <ArrowRight size={14} className="text-zinc-300" />}
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RosterRow({ player, showStats = false }) {
  const fragilityColor = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#ef4444',
  }[player.fragility];

  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600 flex-shrink-0">
        {player.number || '—'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{player.name}</p>
        <p className="text-xs text-zinc-400">{player.position || '—'}</p>
      </div>
      {showStats && (
        <>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-zinc-900">{player.ppg ?? '—'}</p>
            <p className="text-xs text-zinc-400">PPG</p>
          </div>
          <div
            className="w-16 text-center text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ color: fragilityColor || '#a1a1aa', backgroundColor: `${fragilityColor || '#a1a1aa'}18` }}
          >
            {player.fragility || '—'}
          </div>
        </>
      )}
    </div>
  );
}

export default function Overview() {
  const { selectedTeam } = useTeam();
  const [stats, setStats] = useState(null);
  const [roster, setRoster] = useState([]);
  const [topPlayer, setTopPlayer] = useState(null);
  const [highRisk, setHighRisk] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setStats(DUMMY_TEAM_STATS);
      setRoster(DUMMY_ROSTER);
      setTopPlayer([...DUMMY_ROSTER].sort((a, b) => b.ppg - a.ppg)[0]);
      setHighRisk(DUMMY_ROSTER.filter(p => p.fragility === 'High').length);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, rosterRes] = await Promise.all([
          api.teams.stats(selectedTeam.id),
          api.teams.roster(selectedTeam.id),
        ]);
        if (cancelled) return;
        const players = rosterRes.players || [];
        setRoster(players);
        setStats({
          record: statsRes.record,
          capSpace: statsRes.cap_space ?? 0,
          totalSalary: statsRes.total_salary ?? 0,
          salaryCap: statsRes.salary_cap ?? 140588000,
          offRating: statsRes.off_rating ?? 0,
          defRating: statsRes.def_rating ?? 0,
          netRating: statsRes.net_rating ?? 0,
        });
        if (players.length > 0) {
          const playerStats = await Promise.all(
            players.slice(0, 5).map(p => api.players.get(p.player_id).catch(() => null))
          );
          if (cancelled) return;
          const withPpg = playerStats.filter(Boolean);
          const top = withPpg.sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0))[0];
          setTopPlayer(top ? { name: top.name, ppg: top.ppg } : null);
        }
        const fragilities = await Promise.all(
          players.slice(0, 10).map(p => api.analytics.fragility(p.player_id).catch(() => null))
        );
        if (cancelled) return;
        setHighRisk(fragilities.filter(f => f?.label === 'High').length);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStats(DUMMY_TEAM_STATS);
          setRoster(DUMMY_ROSTER);
          setTopPlayer([...DUMMY_ROSTER].sort((a, b) => b.ppg - a.ppg)[0]);
          setHighRisk(DUMMY_ROSTER.filter(p => p.fragility === 'High').length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedTeam?.id]);

  const displayStats = stats || DUMMY_TEAM_STATS;
  const displayRoster = roster.length ? roster : DUMMY_ROSTER;
  const displayTopPlayer = topPlayer || [...DUMMY_ROSTER].sort((a, b) => b.ppg - a.ppg)[0];
  const capUsedPct = displayStats.salaryCap
    ? Math.round(((displayStats.totalSalary ?? 0) / displayStats.salaryCap) * 100)
    : 0;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Using demo data (API unavailable: {error})
        </div>
      )}
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900">
          {selectedTeam ? `${selectedTeam.city} ${selectedTeam.name}` : 'Your Team'}
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">2024–25 Season · War Room Dashboard</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Team Record"
          value={`${displayStats.record?.wins ?? 0}–${displayStats.record?.losses ?? 0}`}
          sub={`Net Rating ${displayStats.netRating != null ? (displayStats.netRating >= 0 ? '+' : '') + displayStats.netRating : '—'}`}
          accent="#111111"
        />
        <StatCard
          icon={DollarSign}
          label="Cap Space"
          value={`$${((displayStats.capSpace ?? 0) / 1e6).toFixed(1)}M`}
          sub={`${capUsedPct}% of cap used`}
          accent="#10b981"
          to="/dashboard/contract-valuator"
        />
        <StatCard
          icon={TrendingUp}
          label="Top Performer"
          value={displayTopPlayer.ppg ?? '—'}
          sub={`${displayTopPlayer.name} · PPG`}
          accent="#3b82f6"
          to="/dashboard/performance-predictor"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Risk Players"
          value={highRisk}
          sub="Fragility score ≥ 70"
          accent="#ef4444"
          to="/dashboard/fragility-score"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent scoring */}
        <div className="card p-5 md:col-span-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Recent Scoring (last 7 games)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={RECENT_GAMES} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111111" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="game" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis domain={[85, 135]} tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#111' }}
              />
              <Area type="monotone" dataKey="score" stroke="#111111" strokeWidth={2} fill="url(#scoreGrad)" dot={{ r: 3, fill: '#111' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cap breakdown */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Salary Cap
          </p>
          <div className="flex flex-col gap-3">
              <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Used</span>
                <span className="font-medium text-zinc-900">${((displayStats.totalSalary ?? 0) / 1e6).toFixed(1)}M</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${capUsedPct}%`, transition: 'width 600ms ease' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Cap</p>
                <p className="text-sm font-bold text-zinc-900">${((displayStats.salaryCap ?? 0) / 1e6).toFixed(1)}M</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Space</p>
                <p className="text-sm font-bold text-emerald-600">${((displayStats.capSpace ?? 0) / 1e6).toFixed(1)}M</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Off Rtg</p>
                <p className="text-sm font-bold text-zinc-900">{displayStats.offRating ?? '—'}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Def Rtg</p>
                <p className="text-sm font-bold text-zinc-900">{displayStats.defRating ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster snapshot */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Roster Snapshot</p>
          <span className="text-xs text-zinc-400">{displayRoster.length} players</span>
        </div>
        <div>
          {displayRoster.slice(0, 8).map(p => (
            <RosterRow
              key={p.player_id ?? p.id}
              player={{
                number: p.number,
                name: p.name,
                position: p.position,
                ppg: p.ppg,
                fragility: p.fragility,
              }}
              showStats={!!p.ppg}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
