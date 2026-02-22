import { useTeam } from '../../context/TeamContext';
import { DUMMY_ROSTER, DUMMY_TEAM_STATS } from '../../data/dummyRoster';
import { TrendingUp, DollarSign, AlertTriangle, Trophy, ArrowRight } from 'lucide-react';
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

function RosterRow({ player }) {
  const fragilityColor = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#ef4444',
  }[player.fragility];

  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0">
      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600 flex-shrink-0">
        {player.number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{player.name}</p>
        <p className="text-xs text-zinc-400">{player.position}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-zinc-900">{player.ppg}</p>
        <p className="text-xs text-zinc-400">PPG</p>
      </div>
      <div
        className="w-16 text-center text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: fragilityColor, backgroundColor: `${fragilityColor}18` }}
      >
        {player.fragility}
      </div>
    </div>
  );
}

export default function Overview() {
  const { selectedTeam } = useTeam();
  const stats = DUMMY_TEAM_STATS;
  const topPlayer = [...DUMMY_ROSTER].sort((a, b) => b.ppg - a.ppg)[0];
  const highRisk = DUMMY_ROSTER.filter(p => p.fragility === 'High').length;
  const capUsedPct = Math.round((stats.totalSalary / stats.salaryCap) * 100);

  return (
    <div className="flex flex-col gap-6">
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
          value={`${stats.record.wins}–${stats.record.losses}`}
          sub={`Net Rating +${stats.netRating}`}
          accent="#111111"
        />
        <StatCard
          icon={DollarSign}
          label="Cap Space"
          value={`$${(stats.capSpace / 1e6).toFixed(1)}M`}
          sub={`${capUsedPct}% of cap used`}
          accent="#10b981"
          to="/dashboard/contract-valuator"
        />
        <StatCard
          icon={TrendingUp}
          label="Top Performer"
          value={topPlayer.ppg}
          sub={`${topPlayer.name} · PPG`}
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
                <span className="font-medium text-zinc-900">${(stats.totalSalary / 1e6).toFixed(1)}M</span>
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
                <p className="text-sm font-bold text-zinc-900">${(stats.salaryCap / 1e6).toFixed(1)}M</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Space</p>
                <p className="text-sm font-bold text-emerald-600">${(stats.capSpace / 1e6).toFixed(1)}M</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Off Rtg</p>
                <p className="text-sm font-bold text-zinc-900">{stats.offRating}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Def Rtg</p>
                <p className="text-sm font-bold text-zinc-900">{stats.defRating}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster snapshot */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Roster Snapshot</p>
          <span className="text-xs text-zinc-400">{DUMMY_ROSTER.length} players</span>
        </div>
        <div>
          {DUMMY_ROSTER.slice(0, 8).map(p => (
            <RosterRow key={p.id} player={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
