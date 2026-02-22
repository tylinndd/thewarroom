import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeamProvider, useTeam } from './context/TeamContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import ShotHotspots from './pages/dashboard/ShotHotspots';
import PerformancePredictor from './pages/dashboard/PerformancePredictor';
import FragilityScore from './pages/dashboard/FragilityScore';
import ContractValuator from './pages/dashboard/ContractValuator';
import TeamFitEngine from './pages/dashboard/TeamFitEngine';
import TeamValueProjection from './pages/dashboard/TeamValueProjection';
import TradeSimulator from './pages/dashboard/TradeSimulator';
import AIChat from './pages/dashboard/AIChat';
import Settings from './pages/dashboard/Settings';

function AuthGuard({ children }) {
  const { isAuthenticated } = useTeam();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function TeamGuard({ children }) {
  const { isAuthenticated, selectedTeam } = useTeam();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!selectedTeam) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/onboarding"
        element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        }
      />
      <Route
        path="/dashboard"
        element={
          <TeamGuard>
            <DashboardLayout />
          </TeamGuard>
        }
      >
        <Route index element={<Overview />} />
        <Route path="shot-hotspots" element={<ShotHotspots />} />
        <Route path="performance-predictor" element={<PerformancePredictor />} />
        <Route path="fragility-score" element={<FragilityScore />} />
        <Route path="contract-valuator" element={<ContractValuator />} />
        <Route path="team-fit" element={<TeamFitEngine />} />
        <Route path="team-value" element={<TeamValueProjection />} />
        <Route path="trade-simulator" element={<TradeSimulator />} />
        <Route path="ai-chat" element={<AIChat />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <TeamProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TeamProvider>
  );
}
