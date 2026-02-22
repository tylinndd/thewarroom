import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
import { Loader2 } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SALARY_CAP = 152700000;

function valuationStatus(salary, fairValue) {
  const ratio = salary / fairValue;
  if (ratio > 1.2) return { label: 'Overpaid', color: '#ef4444' };
  if (ratio < 0.85) return { label: 'Underpaid', color: '#10b981' };
  return { label: 'Fair Value', color: '#a1a1aa' };
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const status = valuationStatus(payload.salary, payload.fairValue);
  return (
    <circle cx={cx} cy={cy} r={6} fill={status.color} fillOpacity={0.85} stroke="white" strokeWidth={1.5} />
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const status = valuationStatus(d.salary, d.fairValue);
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 text-xs shadow-md">
      <p className="font-semibold text-zinc-900 mb-1">{d.name}</p>
      <p className="text-zinc-500">Salary: <span className="font-medium text-zinc-800">${(d.salary / 1e6).toFixed(1)}M</span></p>
      <p className="text-zinc-500">Win Shares: <span className="font-medium text-zinc-800">{d.win_shares}</span></p>
      <p className="text-zinc-500">Fair Value: <span className="font-medium text-zinc-800">${(d.fairValue / 1e6).toFixed(1)}M</span></p>
      <p className="mt-1 font-semibold" style={{ color: status.color }}>{status.label}</p>
    </div>
  );
};

export default function ContractValuator() {
  const { selectedTeam } = useTeam();
  const [roster, setRoster] = useState([]);
  const [contractData, setContractData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setRoster(DUMMY_ROSTER);
      setContractData(DUMMY_ROSTER.map(p => ({
        id: p.id, name: p.name, salary: p.salary, win_shares: p.win_shares,
        fairValue: p.fairValue, position: p.position,
      })));
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.teams.roster(selectedTeam.id)
      .then(res => {
        const players = res.players || [];
        if (cancelled) return;
        setRoster(players);
        return Promise.all(players.map(p =>
          api.analytics.contract(p.player_id).then(c => ({ ...c, id: p.player_id, name: c.name, position: p.position })).catch(() => null)
        ));
      })
      .then(results => {
        if (cancelled) return;
        const list = (results || []).filter(Boolean).map(c => ({
          id: c.player_id, name: c.name, salary: c.current_salary ?? 0, win_shares: c.win_shares ?? 0,
          fairValue: c.fair_value ?? 0, position: c.position ?? '—',
        }));
        setContractData(list);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setRoster(DUMMY_ROSTER);
          setContractData(DUMMY_ROSTER.map(p => ({
            id: p.id, name: p.name, salary: p.salary, win_shares: p.win_shares,
            fairValue: p.fairValue, position: p.position,
          })));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTeam?.id]);

  const data = contractData.length ? contractData : DUMMY_ROSTER.map(p => ({
    id: p.id,
    name: p.name,
    salary: p.salary,
    win_shares: p.win_shares,
    fairValue: p.fairValue,
    position: p.position,
  }));

  if (loading && !contractData.length) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Reference line: fair value slope
  // We'll draw two reference points manually as a line
  const refLinePoints = [
    { win_shares: 0, salary: 0 },
    { win_shares: 12, salary: 42000000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Using demo data (API unavailable)
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Contract Valuator</h2>
        <p className="text-sm text-zinc-500">
          Fair Market Value calculated using Win Shares relative to the salary cap ($152.7M). Players above the line are overpaid; below are bargains.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { label: 'Overpaid', color: '#ef4444' },
          { label: 'Fair Value', color: '#a1a1aa' },
          { label: 'Underpaid', color: '#10b981' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scatter chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Salary vs. Win Shares
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                type="number"
                dataKey="win_shares"
                name="Win Shares"
                domain={[0, 12]}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              >
                <Label value="Win Shares" offset={-10} position="insideBottom" style={{ fontSize: 10, fill: '#a1a1aa' }} />
              </XAxis>
              <YAxis
                type="number"
                dataKey="salary"
                name="Salary"
                domain={[0, 35000000]}
                tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Fair-value reference line */}
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 12, y: 33000000 },
                ]}
                stroke="#d4d4d8"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'Fair Value', position: 'insideTopRight', fontSize: 9, fill: '#a1a1aa' }}
              />
              <Scatter
                data={data}
                shape={<CustomDot />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Contract table */}
        <div className="card p-5 overflow-hidden">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Contract Breakdown</p>
          <div className="flex flex-col gap-0">
            {[...data].sort((a, b) => b.salary - a.salary).map(p => {
              const status = valuationStatus(p.salary, p.fairValue);
              const Icon = status.label === 'Overpaid' ? TrendingUp : status.label === 'Underpaid' ? TrendingDown : Minus;
              return (
                <div key={p.id} className="flex items-center gap-2 py-2.5 border-b border-zinc-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-900 truncate">{p.name}</p>
                    <p className="text-xs text-zinc-400">${(p.salary / 1e6).toFixed(1)}M · {p.win_shares} WS</p>
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: status.color, backgroundColor: `${status.color}18` }}
                  >
                    <Icon size={10} />
                    {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
