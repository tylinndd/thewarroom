import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, AlertTriangle, DollarSign, Users, BarChart3, ArrowRight, Zap } from 'lucide-react';

const FEATURES = [
  {
    id: 'hotspots',
    icon: Activity,
    title: 'Shot Hotspots',
    description: 'Visualize shooting efficiency across every zone on the court. PPS and FG% heatmaps derived from live tracking data.',
    span: 'col-span-2 row-span-2',
    accent: '#111111',
  },
  {
    id: 'predictor',
    icon: TrendingUp,
    title: 'Performance Predictor',
    description: 'Random Forest model trained on the last 20 games + opponent Defensive Rating.',
    span: 'col-span-1 row-span-1',
    accent: '#3b82f6',
  },
  {
    id: 'fragility',
    icon: AlertTriangle,
    title: 'Fragility Score',
    description: 'Injury risk index based on age, MPG, usage rate, and back-to-back frequency.',
    span: 'col-span-1 row-span-1',
    accent: '#f59e0b',
  },
  {
    id: 'contract',
    icon: DollarSign,
    title: 'Contract Valuator',
    description: 'Fair Market Value calculation anchored to Win Shares relative to the salary cap.',
    span: 'col-span-1 row-span-1',
    accent: '#10b981',
  },
  {
    id: 'fit',
    icon: Users,
    title: 'Team Fit Engine',
    description: 'pgvector cosine similarity search — find players that match your team identity.',
    span: 'col-span-1 row-span-1',
    accent: '#8b5cf6',
  },
  {
    id: 'value',
    icon: BarChart3,
    title: 'Team Value Projection',
    description: '5-year Monte Carlo simulation of win trajectory and franchise financial valuation.',
    span: 'col-span-2 row-span-1',
    accent: '#ec4899',
  },
];

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  const isBig = feature.span.includes('row-span-2');

  return (
    <div
      className={`card p-6 flex flex-col gap-3 cursor-default ${feature.span}`}
      style={{ minHeight: isBig ? 280 : 140 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${feature.accent}14` }}
      >
        <Icon size={20} style={{ color: feature.accent }} />
      </div>
      <div>
        <h3 className={`font-semibold text-zinc-900 ${isBig ? 'text-xl mb-2' : 'text-base mb-1'}`}>
          {feature.title}
        </h3>
        <p className={`text-zinc-500 leading-relaxed ${isBig ? 'text-sm' : 'text-xs'}`}>
          {feature.description}
        </p>
      </div>
      {isBig && (
        <div className="mt-auto">
          <div className="flex gap-2 flex-wrap">
            {['Real-time data', 'nba_api', 'AI-powered'].map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-zinc-900" />
            <span className="font-semibold text-zinc-900 text-sm tracking-tight">The War Room</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors font-medium px-3 py-1.5"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm bg-zinc-900 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-zinc-700 transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-36 pb-16">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-white border border-zinc-200 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            NBA Executive AI Suite
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 text-center leading-tight tracking-tight mb-5">
          Every decision.<br />
          <span className="text-zinc-400">Every advantage.</span>
        </h1>
        <p className="text-lg text-zinc-500 text-center max-w-xl mx-auto mb-10 leading-relaxed">
          A high-performance decision-support suite for NBA front offices — bridging on-court performance with front-office economics.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Start for free
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl px-6 py-3 text-sm font-semibold hover:bg-zinc-50 transition-colors"
          >
            View demo
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: '1fr' }}>
          {FEATURES.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-400 font-medium">The War Room</span>
          </div>
          <p className="text-xs text-zinc-400">NBA Executive AI Suite · 2025</p>
        </div>
      </footer>
    </div>
  );
}
