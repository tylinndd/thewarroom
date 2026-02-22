import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext';
import { NBA_TEAMS } from '../../data/teams';
import TeamLogo from '../../components/TeamLogo';
import { User, Shield, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const { user, selectedTeam, updateDisplayName, selectTeam, logout } = useTeam();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    if (displayName.trim()) {
      updateDisplayName(displayName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function handleSwitchTeam() {
    navigate('/onboarding');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Settings</h2>
        <p className="text-sm text-zinc-500">Manage your profile and team configuration.</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={15} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Profile</h3>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Rob Pelinka"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-400 mt-1">Email cannot be changed in this demo.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Save changes
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 size={13} />
                Saved!
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Team */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={15} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Team Configuration</h3>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 mb-4">
          {selectedTeam ? (
            <>
              <TeamLogo team={selectedTeam} size={48} />
              <div>
                <p className="text-sm font-semibold text-zinc-900">{selectedTeam.city} {selectedTeam.name}</p>
                <p className="text-xs text-zinc-400">Team ID: {selectedTeam.id} · {selectedTeam.abbr}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">No team selected</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 mb-1">
            Switching teams re-scopes all features — Shot Hotspots, Trade Simulator, AI Chat, and roster data will reflect the new team immediately.
          </p>
          <button
            onClick={handleSwitchTeam}
            className="flex items-center gap-2 w-fit px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={14} />
            Switch Team
          </button>
        </div>
      </div>

      {/* All teams reference */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">All 30 NBA Teams</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {NBA_TEAMS.map(team => (
            <button
              key={team.id}
              onClick={() => { selectTeam(team); }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                selectedTeam?.id === team.id
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-100 hover:border-zinc-300'
              }`}
            >
              <TeamLogo team={team} size={32} />
              <p className="text-xs text-zinc-600 leading-tight">{team.abbr}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-3">Sign Out</h3>
        <p className="text-xs text-zinc-500 mb-4">
          You will be returned to the landing page and your session will end.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
