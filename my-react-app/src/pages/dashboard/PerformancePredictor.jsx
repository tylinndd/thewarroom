import { useState } from 'react';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
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

const OPPONENT = 'vs. Boston Celtics · Next Game';

export default function PerformancePredictor() {
  const [selectedId, setSelectedId] = useState(DUMMY_ROSTER[0].id);
  const player = DUMMY_ROSTER.find(p => p.id === selectedId);

  const chartData = [
    { stat: 'PPG',  Actual: player.ppg,  Predicted: player.predicted.ppg },
    { stat: 'RPG',  Actual: player.rpg,  Predicted: player.predicted.rpg },
    { stat: 'APG',  Actual: player.apg,  Predicted: player.predicted.apg },
  ];

  const stats = [
    { label: 'Points', actual: player.ppg,  predicted: player.predicted.ppg },
    { label: 'Rebounds', actual: player.rpg,  predicted: player.predicted.rpg },
    { label: 'Assists', actual: player.apg,  predicted: player.predicted.apg },
    { label: 'FG%', actual: (player.fg_pct * 100).toFixed(1), predicted: ((player.fg_pct + 0.012) * 100).toFixed(1) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Performance Predictor</h2>
        <p className="text-sm text-zinc-500">
          Random Forest model trained on last 20 games + opponent Defensive Rating. Opponent: <span className="font-medium text-zinc-700">{OPPONENT}</span>
        </p>
      </div>

      {/* Player selector */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Select Player</p>
        <div className="flex flex-wrap gap-2">
          {DUMMY_ROSTER.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedId === p.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              <span className="font-bold">{p.position}</span>
              {p.name}
            </button>
          ))}
        </div>
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
                <span className="text-zinc-700 font-medium">108.4</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Confidence</span>
                <span className="text-zinc-700 font-medium">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
