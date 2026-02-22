import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import Sidebar from '../components/Sidebar';
import TeamLogo from '../components/TeamLogo';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/dashboard/shot-hotspots': 'Shot Hotspots',
  '/dashboard/performance-predictor': 'Performance Predictor',
  '/dashboard/fragility-score': 'Fragility Score',
  '/dashboard/contract-valuator': 'Contract Valuator',
  '/dashboard/team-fit': 'Team Fit Engine',
  '/dashboard/team-value': 'Team Value Projection',
  '/dashboard/trade-simulator': 'Trade Simulator',
  '/dashboard/ai-chat': 'AI Chat',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedTeam } = useTeam();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-6 py-3 glass border-b border-white/30 flex-shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-zinc-900 truncate">{pageTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {selectedTeam && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100">
                <TeamLogo team={selectedTeam} size={18} />
                <span className="text-xs font-medium text-zinc-700">
                  {selectedTeam.city} {selectedTeam.name}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
