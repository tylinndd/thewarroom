import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DUMMY_ROSTER } from '../../data/dummyRoster';
import { NBA_TEAMS } from '../../data/teams';
import { useTeam } from '../../context/TeamContext';
import TeamLogo from '../../components/TeamLogo';
import { ArrowLeftRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

function rosterToTradeFormat(players) {
  return (players || []).map(p => ({
    player_id: p.player_id ?? p.id,
    name: p.name,
    salary: p.salary ?? 10_000_000,
  }));
}

// Generate a fake opposing team roster when API unavailable
function generateOpponentRoster(teamId) {
  const names = [
    ['Jordan Wells', 'PG'], ['Stefon Cruz', 'SG'], ['Andre Hamilton', 'SF'],
    ['Myles Burton', 'PF'], ['Terrence Wade', 'C'], ['Calvin Ross', 'SG'],
    ['Devon Nash', 'SF'], ['Omar Keaton', 'PG'], ['Brett Sinclair', 'C'],
  ];
  return names.map((n, i) => ({
    id: 1000 + i,
    name: n[0],
    position: n[1],
    salary: Math.round((3 + Math.random() * 22) * 1e6 / 1e5) * 1e5,
    ppg: parseFloat((5 + Math.random() * 20).toFixed(1)),
  }));
}

const SALARY_MATCH_THRESHOLD = 0.25; // within 25%

function PlayerChip({ player, selected, onClick, side }) {
  const isSelected = selected.some(p => p.id === player.id);
  return (
    <button
      onClick={() => onClick(player)}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border text-left transition-all ${
        isSelected
          ? side === 'mine'
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
      }`}
    >
      <div>
        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{player.name}</p>
        <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>{player.position} · ${(player.salary / 1e6).toFixed(1)}M</p>
      </div>
      {isSelected && <CheckCircle2 size={14} className="opacity-80 flex-shrink-0" />}
    </button>
  );
}

function SalaryGauge({ mine, theirs }) {
  const diff = mine - theirs;
  const pct = Math.abs(diff) / Math.max(mine, theirs, 1);
  const matched = pct <= SALARY_MATCH_THRESHOLD || (mine === 0 && theirs === 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-4 text-sm font-semibold">
        <span className="text-zinc-900">${(mine / 1e6).toFixed(1)}M</span>
        <ArrowLeftRight size={16} className="text-zinc-400" />
        <span className="text-zinc-900">${(theirs / 1e6).toFixed(1)}M</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
        matched
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}>
        {matched
          ? <><CheckCircle2 size={11} /> Salary match ✓</>
          : <><XCircle size={11} /> Off by ${(Math.abs(diff) / 1e6).toFixed(1)}M</>
        }
      </div>
    </div>
  );
}

export default function TradeSimulator() {
  const { selectedTeam } = useTeam();
  const [oppTeamId, setOppTeamId] = useState(NBA_TEAMS[1]?.id ?? 1610612738);
  const [myRoster, setMyRoster] = useState([]);
  const [oppRoster, setOppRoster] = useState([]);
  const [mySelected, setMySelected] = useState([]);
  const [theirSelected, setTheirSelected] = useState([]);
  const [tradeStatus, setTradeStatus] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const oppTeam = NBA_TEAMS.find(t => t.id === oppTeamId);

  useEffect(() => {
    if (!selectedTeam?.id) {
      setMyRoster(DUMMY_ROSTER);
      setOppRoster(generateOpponentRoster(oppTeamId));
      return;
    }
    let cancelled = false;
    Promise.all([
      api.teams.roster(selectedTeam.id),
      api.teams.roster(oppTeamId),
    ])
      .then(([mine, theirs]) => {
        if (cancelled) return;
        const my = (mine.players || []).map(p => ({ ...p, player_id: p.player_id, id: p.player_id, salary: 10_000_000 }));
        const opp = (theirs.players || []).map(p => ({ ...p, player_id: p.player_id, id: p.player_id, salary: 10_000_000 }));
        setMyRoster(my.length ? my : DUMMY_ROSTER);
        setOppRoster(opp.length ? opp : generateOpponentRoster(oppTeamId));
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setMyRoster(DUMMY_ROSTER);
          setOppRoster(generateOpponentRoster(oppTeamId));
        }
      });
    return () => { cancelled = true; };
  }, [selectedTeam?.id, oppTeamId]);

  function toggleMine(player) {
    setMySelected(prev =>
      prev.some(p => p.id === player.id)
        ? prev.filter(p => p.id !== player.id)
        : [...prev, player]
    );
    setTradeStatus(null);
  }

  function toggleTheirs(player) {
    setTheirSelected(prev =>
      prev.some(p => p.id === player.id)
        ? prev.filter(p => p.id !== player.id)
        : [...prev, player]
    );
    setTradeStatus(null);
  }

  function handleReset() {
    setMySelected([]);
    setTheirSelected([]);
    setTradeStatus(null);
  }

  async function handleSimulate() {
    const teamA = rosterToTradeFormat(mySelected);
    const teamB = rosterToTradeFormat(theirSelected);
    if (!selectedTeam?.id || error) {
      const mySal = mySelected.reduce((s, p) => s + (p.salary ?? 0), 0);
      const theirSal = theirSelected.reduce((s, p) => s + (p.salary ?? 0), 0);
      const diff = Math.abs(mySal - theirSal) / Math.max(mySal, theirSal, 1);
      setTradeStatus(diff <= SALARY_MATCH_THRESHOLD ? 'accepted' : 'rejected');
      return;
    }
    setLoading(true);
    setApiResult(null);
    try {
      const res = await api.trades.simulate({
        team_a_players: teamA,
        team_b_players: teamB,
        team_a_id: selectedTeam.id,
        team_b_id: oppTeamId,
      });
      setApiResult(res);
      setTradeStatus(res.is_legal ? 'accepted' : 'rejected');
    } catch (err) {
      const mySal = mySelected.reduce((s, p) => s + (p.salary ?? 0), 0);
      const theirSal = theirSelected.reduce((s, p) => s + (p.salary ?? 0), 0);
      const diff = Math.abs(mySal - theirSal) / Math.max(mySal, theirSal, 1);
      setTradeStatus(diff <= SALARY_MATCH_THRESHOLD ? 'accepted' : 'rejected');
    } finally {
      setLoading(false);
    }
  }

  const mySalary = mySelected.reduce((s, p) => s + (p.salary ?? 0), 0);
  const theirSalary = theirSelected.reduce((s, p) => s + (p.salary ?? 0), 0);
  const canSimulate = mySelected.length > 0 && theirSelected.length > 0;

  const displayMyRoster = myRoster.length ? myRoster : DUMMY_ROSTER;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Using demo rosters (API unavailable)
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Trade Simulator</h2>
        <p className="text-sm text-zinc-500">
          Select players on both sides. Trades must be within 25% salary matching rules to be approved.
        </p>
      </div>

      {/* Opponent picker */}
      <div className="card p-4 flex items-center gap-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex-shrink-0">Trade with</p>
        <select
          value={oppTeamId}
          onChange={e => setOppTeamId(Number(e.target.value))}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        >
          {NBA_TEAMS.filter(t => !selectedTeam || t.id !== selectedTeam.id).map(t => (
            <option key={t.id} value={t.id}>{t.city} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Trade block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My team */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {selectedTeam && <TeamLogo team={selectedTeam} size={22} />}
            <p className="text-xs font-semibold text-zinc-900">
              {selectedTeam ? `${selectedTeam.city} ${selectedTeam.name}` : 'My Team'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {displayMyRoster.map(p => (
              <PlayerChip key={p.id} player={p} selected={mySelected} onClick={toggleMine} side="mine" />
            ))}
          </div>
        </div>

        {/* Opponent */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {oppTeam && <TeamLogo team={oppTeam} size={22} />}
            <p className="text-xs font-semibold text-zinc-900">
              {oppTeam ? `${oppTeam.city} ${oppTeam.name}` : 'Opponent'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {oppRoster.map(p => (
              <PlayerChip key={p.id} player={p} selected={theirSelected} onClick={toggleTheirs} side="theirs" />
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="card p-4 flex flex-col items-center gap-4">
        <SalaryGauge mine={mySalary} theirs={theirSalary} />

        {mySelected.length > 0 || theirSelected.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center text-xs text-zinc-500">
            {mySelected.length > 0 && (
              <span>Sending: <span className="font-medium text-zinc-800">{mySelected.map(p => p.name).join(', ')}</span></span>
            )}
            {mySelected.length > 0 && theirSelected.length > 0 && <span className="text-zinc-300">·</span>}
            {theirSelected.length > 0 && (
              <span>Receiving: <span className="font-medium text-zinc-800">{theirSelected.map(p => p.name).join(', ')}</span></span>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Select players on both sides to build a trade</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={13} />
            Reset
          </button>
          <button
            onClick={handleSimulate}
            disabled={!canSimulate || loading}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Simulating…' : (
              <>
                <ArrowLeftRight size={13} />
                Simulate Trade
              </>
            )}
          </button>
        </div>

        {tradeStatus === 'accepted' && (
          <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Trade approved! Salary rules satisfied.</span>
            {apiResult && (
              <span className="text-xs font-normal text-emerald-600">
                Team A cap after: ${(apiResult.team_a_cap_after / 1e6).toFixed(1)}M · Team B cap after: ${(apiResult.team_b_cap_after / 1e6).toFixed(1)}M
              </span>
            )}
          </div>
        )}
        {tradeStatus === 'rejected' && (
          <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            <span className="flex items-center gap-2"><XCircle size={16} /> {apiResult?.reason || 'Trade rejected. Salary mismatch exceeds CBA rules.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
