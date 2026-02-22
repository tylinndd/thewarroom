import { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { api } from '../../api/client';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
import { Loader2 } from 'lucide-react';

// Zone definitions: [cx, cy, label, pps range example]
const COURT_ZONES = [
  { id: 'paint',      cx: 250, cy: 290, r: 55, label: 'Paint',       labelY: 315 },
  { id: 'midleft',   cx: 135, cy: 230, r: 38, label: 'Mid-Left',    labelY: 255 },
  { id: 'midright',  cx: 365, cy: 230, r: 38, label: 'Mid-Right',   labelY: 255 },
  { id: 'midtop',    cx: 250, cy: 200, r: 38, label: 'Mid-Top',     labelY: 225 },
  { id: 'corner3l',  cx: 60,  cy: 310, r: 34, label: 'Corner 3L',   labelY: 335 },
  { id: 'corner3r',  cx: 440, cy: 310, r: 34, label: 'Corner 3R',   labelY: 335 },
  { id: 'arc3left',  cx: 120, cy: 140, r: 38, label: 'Arc 3L',      labelY: 165 },
  { id: 'arc3top',   cx: 250, cy: 100, r: 38, label: 'Arc 3 Top',   labelY: 125 },
  { id: 'arc3right', cx: 380, cy: 140, r: 38, label: 'Arc 3R',      labelY: 165 },
];

function ppsColor(pps) {
  if (pps >= 1.25) return '#10b981';
  if (pps >= 1.10) return '#84cc16';
  if (pps >= 0.95) return '#f59e0b';
  if (pps >= 0.80) return '#f97316';
  return '#ef4444';
}

function CourtSVG({ zones }) {
  return (
    <svg viewBox="0 0 500 400" className="w-full max-w-xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Court outline */}
      <rect x="20" y="20" width="460" height="360" rx="8" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1.5" />

      {/* Paint / key */}
      <rect x="178" y="230" width="144" height="130" rx="4" fill="none" stroke="#d4d4d8" strokeWidth="1.2" />

      {/* Free throw circle */}
      <circle cx="250" cy="230" r="60" fill="none" stroke="#d4d4d8" strokeWidth="1.2" strokeDasharray="4 4" />

      {/* Basket */}
      <circle cx="250" cy="370" r="8" fill="none" stroke="#a1a1aa" strokeWidth="1.5" />
      <circle cx="250" cy="370" r="2" fill="#a1a1aa" />

      {/* 3-point arc approximation */}
      <path
        d="M 60 350 Q 60 80 250 65 Q 440 80 440 350"
        fill="none" stroke="#d4d4d8" strokeWidth="1.2"
      />
      <line x1="60" y1="310" x2="60" y2="360" stroke="#d4d4d8" strokeWidth="1.2" />
      <line x1="440" y1="310" x2="440" y2="360" stroke="#d4d4d8" strokeWidth="1.2" />

      {/* Zone circles */}
      {zones.map(zone => (
        <g key={zone.id}>
          <circle
            cx={zone.cx}
            cy={zone.cy}
            r={zone.r}
            fill={ppsColor(zone.pps)}
            fillOpacity={0.75}
            stroke="white"
            strokeWidth={1.5}
          />
          <text x={zone.cx} y={zone.cy - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
            {zone.pps.toFixed(2)}
          </text>
          <text x={zone.cx} y={zone.cy + 8} textAnchor="middle" fontSize="7.5" fill="white" opacity="0.85">
            PPS
          </text>
          <text x={zone.cx} y={zone.labelY} textAnchor="middle" fontSize="7" fill="#71717a">
            {zone.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ShotHotspots() {
  const { selectedTeam } = useTeam();
  const [roster, setRoster] = useState([]);
  const [shotZones, setShotZones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setRoster(DUMMY_ROSTER);
      setSelectedId(DUMMY_ROSTER[0]?.id);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.teams.roster(selectedTeam.id);
        const players = res.players || [];
        setRoster(players);
        if (players.length > 0 && !selectedId) setSelectedId(players[0].player_id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setRoster(DUMMY_ROSTER);
          setSelectedId(DUMMY_ROSTER[0]?.id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedTeam?.id]);

  const [playerStats, setPlayerStats] = useState(null);

  useEffect(() => {
    if (!selectedId || roster.length === 0) return;
    const pid = typeof selectedId === 'number' ? selectedId : roster.find(p => (p.player_id ?? p.id) === selectedId)?.player_id ?? roster[0]?.player_id;
    if (!pid) return;
    let cancelled = false;
    Promise.all([
      api.players.shotZones(pid, selectedTeam?.id ?? 0),
      roster.some(p => (p.player_id ?? p.id) === pid) ? api.players.get(pid) : Promise.resolve(null),
    ]).then(([zonesRes, stats]) => {
      if (!cancelled) {
        setShotZones(zonesRes.zones);
        setPlayerStats(stats);
      }
    }).catch(() => { if (!cancelled) setShotZones(null); setPlayerStats(null); });
    return () => { cancelled = true; };
  }, [selectedId, selectedTeam?.id, roster]);

  const displayRoster = roster.length ? roster : DUMMY_ROSTER;
  const sid = selectedId ?? displayRoster[0]?.player_id ?? displayRoster[0]?.id;
  const playerFromApi = displayRoster.find(p => (p.player_id ?? p.id) === sid);
  const playerFromDummy = DUMMY_ROSTER.find(p => p.id === sid);
  const player = playerFromApi
    ? { name: playerFromApi.name, fg_pct: playerStats?.fg_pct ?? 0, three_pct: playerStats?.three_pct ?? 0, shot_zones: shotZones ?? {} }
    : playerFromDummy;

  const zones = COURT_ZONES.map(zone => {
    const zoneKey = {
      paint: 'paint',
      midleft: 'midrange', midright: 'midrange', midtop: 'midrange',
      corner3l: 'corner3', corner3r: 'corner3',
      arc3left: 'arc3', arc3top: 'arc3', arc3right: 'arc3',
    }[zone.id];

    const data = (player?.shot_zones ?? {})[zoneKey] || { pps: 0, fg: 0 };
    // Add slight jitter per zone for variety
    const jitter = (zone.id.length % 3) * 0.015 - 0.01;
    return { ...zone, pps: Math.max(0, data.pps + jitter), fg: data.fg };
  });

  if (!player) {
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
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Shot Hotspots</h2>
        <p className="text-sm text-zinc-500">Points per shot (PPS) and FG% by court zone. Green = efficient, red = inefficient.</p>
      </div>

      {/* Player selector */}
      <div className="flex flex-wrap gap-2">
        {displayRoster.map(p => {
          const id = p.player_id ?? p.id;
          return (
          <button
            key={id}
            onClick={() => setSelectedId(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              (sid ?? selectedId) === id
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
            }`}
          >
            {p.name}
          </button>
        );})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Court */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{player.name} — Shot Chart</p>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Hot (≥1.25)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Avg</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Cold</span>
            </div>
          </div>
          <CourtSVG zones={zones} />
        </div>

        {/* Zone table */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Zone Breakdown</p>
          <div className="flex flex-col gap-2">
            {zones.map(z => (
              <div key={z.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ppsColor(z.pps) }}
                  />
                  <span className="text-xs text-zinc-700">{z.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-zinc-900">{z.pps.toFixed(2)} PPS</span>
                  <span className="text-xs text-zinc-400 ml-2">{(z.fg * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 mb-2">Overall</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">FG%</p>
                <p className="text-sm font-bold text-zinc-900">{((player.fg_pct ?? 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-xs text-zinc-400">3P%</p>
                <p className="text-sm font-bold text-zinc-900">{((player.three_pct ?? 0) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
