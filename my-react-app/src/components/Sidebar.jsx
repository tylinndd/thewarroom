import { NavLink, useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import TeamLogo from './TeamLogo';
import {
  Zap,
  LayoutDashboard,
  Activity,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  BarChart3,
  ArrowLeftRight,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview',              icon: LayoutDashboard, end: true },
  { to: '/dashboard/shot-hotspots',        label: 'Shot Hotspots',      icon: Activity },
  { to: '/dashboard/performance-predictor', label: 'Performance',        icon: TrendingUp },
  { to: '/dashboard/fragility-score',      label: 'Fragility Score',    icon: AlertTriangle },
  { to: '/dashboard/contract-valuator',    label: 'Contracts',          icon: DollarSign },
  { to: '/dashboard/team-fit',             label: 'Team Fit',           icon: Users },
  { to: '/dashboard/team-value',           label: 'Team Value',         icon: BarChart3 },
  { to: '/dashboard/trade-simulator',      label: 'Trade Sim',          icon: ArrowLeftRight },
  { to: '/dashboard/ai-chat',              label: 'AI Chat',            icon: MessageSquare },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
          isActive
            ? 'bg-zinc-900 text-white'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={12} className="text-white/50" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, selectedTeam, logout } = useTeam();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'EX';

  return (
    <aside
      className="flex flex-col h-full glass border-r border-white/30"
      style={{ width: collapsed ? 64 : 220, transition: 'width 250ms ease' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-zinc-100/60 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-zinc-900 tracking-tight whitespace-nowrap">
            The War Room
          </span>
        )}
      </div>

      {/* Team badge */}
      {selectedTeam && !collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-2 flex-shrink-0">
          <TeamLogo team={selectedTeam} size={24} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">{selectedTeam.city}</p>
            <p className="text-xs text-zinc-400 truncate">{selectedTeam.name}</p>
          </div>
        </div>
      )}
      {selectedTeam && collapsed && (
        <div className="flex justify-center mt-3 mb-1 flex-shrink-0">
          <TeamLogo team={selectedTeam} size={28} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
        {collapsed ? (
          NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`
              }
            >
              {({ isActive }) => <item.icon size={16} className={isActive ? 'text-white' : ''} />}
            </NavLink>
          ))
        ) : (
          NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} />
          ))
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-zinc-100/60 flex flex-col gap-0.5 flex-shrink-0">
        {collapsed ? (
          <>
            <NavLink
              to="/dashboard/settings"
              title="Settings"
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all ${
                  isActive ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`
              }
            >
              <Settings size={16} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <NavItem to="/dashboard/settings" label="Settings" icon={Settings} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} className="text-zinc-400" />
              Sign out
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 px-3 pt-2 mt-1 border-t border-zinc-100/60">
              <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
