import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import TeamLogo from '../components/TeamLogo';
import { Search, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);
  const [pendingTeam, setPendingTeam] = useState(null);

  const { allTeams, selectTeam } = useTeam();
  const navigate = useNavigate();

  const filtered = allTeams.filter(t => {
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.abbr.toLowerCase().includes(q)
    );
  });

  function handleSelect(team) {
    setPendingTeam(team);
  }

  function handleConfirm() {
    if (!pendingTeam) return;
    selectTeam(pendingTeam);
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="pt-16 pb-10 text-center px-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
          Select your team
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto">
          Choose the NBA franchise you represent. Every feature in the app will be scoped to your team.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto w-full px-6 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
          />
        </div>
      </div>

      {/* Team grid */}
      <div className="max-w-4xl mx-auto w-full px-6 flex-1">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-32">
          {filtered.map(team => {
            const isSelected = pendingTeam?.id === team.id;
            const isHovered = hovered === team.id;

            return (
              <button
                key={team.id}
                onClick={() => handleSelect(team)}
                onMouseEnter={() => setHovered(team.id)}
                onMouseLeave={() => setHovered(null)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-zinc-900 bg-white shadow-md'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <CheckCircle2
                    size={16}
                    className="absolute top-2.5 right-2.5 text-zinc-900"
                  />
                )}

                <TeamLogo team={team} size={48} />

                <div className="text-center">
                  <p className="text-xs font-semibold text-zinc-900 leading-tight">{team.city}</p>
                  <p className="text-xs text-zinc-500 leading-tight">{team.name}</p>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-5 text-center py-16 text-zinc-400 text-sm">
              No teams match "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Sticky confirm bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 glass border-t border-white/30 transition-all duration-300 ${
          pendingTeam ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {pendingTeam && (
            <>
              <div className="flex items-center gap-3">
                <TeamLogo team={pendingTeam} size={36} />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{pendingTeam.city} {pendingTeam.name}</p>
                  <p className="text-xs text-zinc-500">You can change this later in Settings</p>
                </div>
              </div>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
              >
                Confirm
                <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
