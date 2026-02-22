import { createContext, useContext, useState } from 'react';
import { NBA_TEAMS } from '../data/teams';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  // Dummy auth state — in production this comes from Supabase Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Selected team state
  const [selectedTeam, setSelectedTeam] = useState(null);

  function login(email) {
    setIsAuthenticated(true);
    setUser({ email, displayName: email.split('@')[0] });
  }

  function logout() {
    setIsAuthenticated(false);
    setUser(null);
    setSelectedTeam(null);
  }

  function selectTeam(team) {
    setSelectedTeam(team);
  }

  function updateDisplayName(name) {
    setUser(prev => ({ ...prev, displayName: name }));
  }

  return (
    <TeamContext.Provider value={{
      isAuthenticated,
      user,
      selectedTeam,
      login,
      logout,
      selectTeam,
      updateDisplayName,
      allTeams: NBA_TEAMS,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
