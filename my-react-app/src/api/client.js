/**
 * API client for The War Room backend.
 * Uses VITE_API_URL when set; otherwise uses same origin + /api proxy during dev.
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'API request failed');
    err.status = res.status;
    try {
      err.detail = (await res.json()).detail;
    } catch {
      err.detail = await res.text();
    }
    throw err;
  }
  return res.json();
}

// Teams
export const api = {
  teams: {
    list: () => request('/api/teams/'),
    roster: (teamId) => request(`/api/teams/${teamId}/roster`),
    stats: (teamId) => request(`/api/teams/${teamId}/stats`),
  },
  players: {
    get: (playerId) => request(`/api/players/${playerId}`),
    shotZones: (playerId, teamId = 0) =>
      request(`/api/players/${playerId}/shot-zones?team_id=${teamId}`),
    gameLog: (playerId, lastN = 20) =>
      request(`/api/players/${playerId}/game-log?last_n=${lastN}`),
  },
  analytics: {
    performance: (playerId, opponentTeamId = null) => {
      const q = opponentTeamId ? `?opponent_team_id=${opponentTeamId}` : '';
      return request(`/api/analytics/performance/${playerId}${q}`);
    },
    fragility: (playerId) => request(`/api/analytics/fragility/${playerId}`),
    contract: (playerId, salary = 0, winShares = 0) => {
      const params = new URLSearchParams();
      if (salary) params.set('salary', salary);
      if (winShares) params.set('win_shares', winShares);
      const q = params.toString() ? `?${params}` : '';
      return request(`/api/analytics/contract/${playerId}${q}`);
    },
  },
  teamFit: {
    search: (body) => request('/api/team-fit/search', { method: 'POST', body: JSON.stringify(body) }),
    similarTo: (playerId, topN = 10, excludeTeamId = null) => {
      const params = new URLSearchParams();
      params.set('top_n', topN);
      if (excludeTeamId) params.set('exclude_team_id', excludeTeamId);
      return request(`/api/team-fit/similar-to/${playerId}?${params}`);
    },
  },
  teamValue: (teamId) => request(`/api/team-value/${teamId}`),
  trades: {
    simulate: (body) => request('/api/trades/simulate', { method: 'POST', body: JSON.stringify(body) }),
  },
  chat: (body) => request('/api/chat/', { method: 'POST', body: JSON.stringify(body) }),
};
