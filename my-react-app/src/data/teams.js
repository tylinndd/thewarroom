export const NBA_TEAMS = [
  { id: 1610612737, name: "Hawks",          city: "Atlanta",        abbr: "ATL", color: "#E03A3E", secondary: "#C1D32F" },
  { id: 1610612738, name: "Celtics",        city: "Boston",         abbr: "BOS", color: "#007A33", secondary: "#BA9653" },
  { id: 1610612751, name: "Nets",           city: "Brooklyn",       abbr: "BKN", color: "#000000", secondary: "#FFFFFF" },
  { id: 1610612766, name: "Hornets",        city: "Charlotte",      abbr: "CHA", color: "#1D1160", secondary: "#00788C" },
  { id: 1610612741, name: "Bulls",          city: "Chicago",        abbr: "CHI", color: "#CE1141", secondary: "#000000" },
  { id: 1610612739, name: "Cavaliers",      city: "Cleveland",      abbr: "CLE", color: "#860038", secondary: "#FDBB30" },
  { id: 1610612742, name: "Mavericks",      city: "Dallas",         abbr: "DAL", color: "#00538C", secondary: "#B8C4CA" },
  { id: 1610612743, name: "Nuggets",        city: "Denver",         abbr: "DEN", color: "#0E2240", secondary: "#FEC524" },
  { id: 1610612765, name: "Pistons",        city: "Detroit",        abbr: "DET", color: "#C8102E", secondary: "#1D42BA" },
  { id: 1610612744, name: "Warriors",       city: "Golden State",   abbr: "GSW", color: "#1D428A", secondary: "#FFC72C" },
  { id: 1610612745, name: "Rockets",        city: "Houston",        abbr: "HOU", color: "#CE1141", secondary: "#C4CED4" },
  { id: 1610612754, name: "Pacers",         city: "Indiana",        abbr: "IND", color: "#002D62", secondary: "#FDBB30" },
  { id: 1610612746, name: "Clippers",       city: "LA",             abbr: "LAC", color: "#C8102E", secondary: "#1D428A" },
  { id: 1610612747, name: "Lakers",         city: "Los Angeles",    abbr: "LAL", color: "#552583", secondary: "#FDB927" },
  { id: 1610612763, name: "Grizzlies",      city: "Memphis",        abbr: "MEM", color: "#5D76A9", secondary: "#12173F" },
  { id: 1610612748, name: "Heat",           city: "Miami",          abbr: "MIA", color: "#98002E", secondary: "#F9A01B" },
  { id: 1610612749, name: "Bucks",          city: "Milwaukee",      abbr: "MIL", color: "#00471B", secondary: "#EEE1C6" },
  { id: 1610612750, name: "Timberwolves",   city: "Minnesota",      abbr: "MIN", color: "#0C2340", secondary: "#236192" },
  { id: 1610612740, name: "Pelicans",       city: "New Orleans",    abbr: "NOP", color: "#0C2340", secondary: "#C8102E" },
  { id: 1610612752, name: "Knicks",         city: "New York",       abbr: "NYK", color: "#006BB6", secondary: "#F58426" },
  { id: 1610612760, name: "Thunder",        city: "Oklahoma City",  abbr: "OKC", color: "#007AC1", secondary: "#EF3B24" },
  { id: 1610612753, name: "Magic",          city: "Orlando",        abbr: "ORL", color: "#0077C0", secondary: "#C4CED4" },
  { id: 1610612755, name: "76ers",          city: "Philadelphia",   abbr: "PHI", color: "#006BB6", secondary: "#ED174C" },
  { id: 1610612756, name: "Suns",           city: "Phoenix",        abbr: "PHX", color: "#1D1160", secondary: "#E56020" },
  { id: 1610612757, name: "Trail Blazers",  city: "Portland",       abbr: "POR", color: "#E03A3E", secondary: "#000000" },
  { id: 1610612758, name: "Kings",          city: "Sacramento",     abbr: "SAC", color: "#5A2D81", secondary: "#63727A" },
  { id: 1610612759, name: "Spurs",          city: "San Antonio",    abbr: "SAS", color: "#C4CED4", secondary: "#000000" },
  { id: 1610612761, name: "Raptors",        city: "Toronto",        abbr: "TOR", color: "#CE1141", secondary: "#000000" },
  { id: 1610612762, name: "Jazz",           city: "Utah",           abbr: "UTA", color: "#002B5C", secondary: "#F9A01B" },
  { id: 1610612764, name: "Wizards",        city: "Washington",     abbr: "WAS", color: "#002B5C", secondary: "#E31837" },
];

export function getTeamById(id) {
  return NBA_TEAMS.find(t => t.id === id) || null;
}

export function getTeamLogoUrl(teamId) {
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
}
