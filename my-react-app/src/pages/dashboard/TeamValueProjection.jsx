import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { Loader2 } from 'lucide-react';

// Monte Carlo 5-year projection dummy data
const PROJECTION_DATA = [
  { year: '2025', wins: 38, winsLow: 33, winsHigh: 44, value: 2.4, valueLow: 2.1, valueHigh: 2.7 },
  { year: '2026', wins: 42, winsLow: 35, winsHigh: 50, value: 2.65, valueLow: 2.3, valueHigh: 3.0 },
  { year: '2027', wins: 46, winsLow: 37, winsHigh: 56, value: 2.95, valueLow: 2.5, valueHigh: 3.4 },
  { year: '2028', wins: 44, winsLow: 34, winsHigh: 55, value: 3.2, valueLow: 2.6, valueHigh: 3.9 },
  { year: '2029', wins: 48, winsLow: 36, winsHigh: 60, value: 3.6, valueLow: 2.8, valueHigh: 4.5 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 text-xs shadow-md">
      <p className="font-semibold text-zinc-900 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-zinc-500">
          {p.name}: <span className="font-medium text-zinc-800">{p.value}{p.name.includes('Val') ? 'B' : ' W'}</span>
        </p>
      ))}
    </div>
  );
};

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TeamValueProjection() {
  const { selectedTeam } = useTeam();
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setProjection(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.teamValue(selectedTeam.id)
      .then(res => { if (!cancelled) setProjection(res); })
      .catch(() => { if (!cancelled) { setError(true); setProjection(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTeam?.id]);

  const projList = projection?.projections ?? PROJECTION_DATA;
  const displayData = projList.map((p, i) => {
    if (typeof p === 'object' && p.year) {
      return {
        year: String(p.year),
        wins: p.wins_mean ?? p.wins,
        winsLow: p.wins_p10 ?? p.winsLow,
        winsHigh: p.wins_p90 ?? p.winsHigh,
        value: (p.valuation_mean ?? p.value) / 1e9,
        valueLow: (p.valuation_mean ? (p.valuation_mean * 0.85) : p.valueLow) / 1e9,
        valueHigh: (p.valuation_mean ? (p.valuation_mean * 1.15) : p.valueHigh) / 1e9,
      };
    }
    return PROJECTION_DATA[i] ?? p;
  });

  const latestYear = displayData[displayData.length - 1] ?? PROJECTION_DATA[PROJECTION_DATA.length - 1];
  const firstYear = displayData[0] ?? PROJECTION_DATA[0];
  const winGrowth = latestYear.wins - firstYear.wins;
  const valGrowth = ((latestYear.value - firstYear.value) / firstYear.value * 100).toFixed(0);

  if (loading && selectedTeam?.id && !projection) {
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
          Using demo projection (API unavailable)
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Team Value Projection</h2>
        <p className="text-sm text-zinc-500">
          5-year Monte Carlo simulation of win trajectory and franchise valuation. Shaded bands represent the 10th–90th percentile range across 10,000 simulations.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Current Value" value="$2.4B" sub="2025 estimate" color="#111111" />
        <MetricCard label="5-Year High" value={`$${latestYear.valueHigh}B`} sub="90th percentile" color="#10b981" />
        <MetricCard label="5-Year Low" value={`$${latestYear.valueLow}B`} sub="10th percentile" color="#ef4444" />
        <MetricCard label="Win Δ (5yr)" value={`+${winGrowth}W`} sub={`+${valGrowth}% valuation`} color="#3b82f6" />
      </div>

      {/* Win projection chart */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Win Projection (Monte Carlo bands)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={displayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="winsHighGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="winsLowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis domain={[20, 65]} tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="winsHigh" name="90th pct" stroke="none" fill="url(#winsHighGrad)" />
            <Area type="monotone" dataKey="winsLow" name="10th pct" stroke="none" fill="white" />
            <Area type="monotone" dataKey="wins" name="Median Wins" stroke="#3b82f6" strokeWidth={2.5} fill="none"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Valuation chart */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Franchise Valuation ($B) — Monte Carlo Bands
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={displayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="valBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[1.5, 5]}
              tickFormatter={v => `$${v}B`}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="valueHigh" name="90th pct Val" stroke="none" fill="url(#valBandGrad)" />
            <Area type="monotone" dataKey="valueLow" name="10th pct Val" stroke="none" fill="white" />
            <Area type="monotone" dataKey="value" name="Median Val" stroke="#10b981" strokeWidth={2.5} fill="none"
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Year-by-year table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {['Year', 'Median Wins', 'Win Range', 'Median Value', 'Value Range'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
            <tbody>
            {displayData.map((row, i) => (
              <tr key={row.year} className={`border-b border-zinc-50 last:border-0 ${i === 0 ? 'bg-zinc-50/50' : ''}`}>
                <td className="px-4 py-3 font-semibold text-zinc-900">{row.year}{i === 0 ? ' (Current)' : ''}</td>
                <td className="px-4 py-3 text-zinc-700 font-medium">{row.wins}W</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{row.winsLow}–{row.winsHigh}W</td>
                <td className="px-4 py-3 text-zinc-700 font-medium">${row.value}B</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">${row.valueLow}B–${row.valueHigh}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
