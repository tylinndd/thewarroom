import { useState } from 'react';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
import { AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

function RiskBadge({ level, score }) {
  const styles = {
    Low:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    Medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    High:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  }[level] || { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' };

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
      style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
    >
      {level === 'High' && <AlertTriangle size={10} />}
      {level} · {score}
    </span>
  );
}

function ScoreBar({ value }) {
  const color = value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-zinc-700 w-6 text-right">{value}</span>
    </div>
  );
}

export default function FragilityScore() {
  const [sortKey, setSortKey] = useState('fragility_score');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(DUMMY_ROSTER[3].id);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...DUMMY_ROSTER].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (typeof va === 'string') return dir * va.localeCompare(vb);
    return dir * (va - vb);
  });

  const player = DUMMY_ROSTER.find(p => p.id === selected);
  const radarData = [
    { axis: 'Age',       value: Math.min(100, Math.max(0, (player.age - 20) * 4)) },
    { axis: 'MPG',       value: Math.min(100, (player.mpg / 38) * 100) },
    { axis: 'Usage',     value: Math.min(100, player.usage_rate * 300) },
    { axis: 'B2Bs',      value: Math.min(100, (player.back_to_backs / 18) * 100) },
    { axis: 'Risk',      value: player.fragility_score },
  ];

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const cols = [
    { key: 'name',            label: 'Player' },
    { key: 'age',             label: 'Age' },
    { key: 'mpg',             label: 'MPG' },
    { key: 'usage_rate',      label: 'Usage%' },
    { key: 'back_to_backs',   label: 'B2Bs' },
    { key: 'fragility_score', label: 'Score' },
    { key: 'fragility',       label: 'Risk' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Fragility Score</h2>
        <p className="text-sm text-zinc-500">
          Injury risk index based on age, minutes per game, usage rate, and back-to-back frequency. No biometrics used.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {cols.map(c => (
                    <th
                      key={c.key}
                      onClick={() => handleSort(c.key)}
                      className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 transition-colors select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        <SortIcon k={c.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`border-b border-zinc-50 last:border-0 cursor-pointer transition-colors ${
                      selected === p.id ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{p.age}</td>
                    <td className="px-4 py-3 text-zinc-600">{p.mpg}</td>
                    <td className="px-4 py-3 text-zinc-600">{(p.usage_rate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-zinc-600">{p.back_to_backs}</td>
                    <td className="px-4 py-3 w-28">
                      <ScoreBar value={p.fragility_score} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={p.fragility} score={p.fragility_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar detail */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            {player.name}
          </p>
          <RiskBadge level={player.fragility} score={player.fragility_score} />
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} outerRadius={70}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#71717a' }} />
                <Radar
                  name="Risk Factors"
                  dataKey="value"
                  stroke={player.fragility === 'High' ? '#ef4444' : player.fragility === 'Medium' ? '#f59e0b' : '#10b981'}
                  fill={player.fragility === 'High' ? '#ef4444' : player.fragility === 'Medium' ? '#f59e0b' : '#10b981'}
                  fillOpacity={0.2}
                />
                <Tooltip contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {[
              { label: 'Age', val: `${player.age} yrs` },
              { label: 'MPG', val: `${player.mpg} min` },
              { label: 'Usage Rate', val: `${(player.usage_rate * 100).toFixed(1)}%` },
              { label: 'Back-to-Backs', val: `${player.back_to_backs} games` },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-zinc-400">{item.label}</span>
                <span className="font-medium text-zinc-700">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
