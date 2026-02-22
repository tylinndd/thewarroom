import { useState } from 'react';
import { getTeamLogoUrl } from '../data/teams';

/**
 * Renders the official NBA team logo from the NBA CDN.
 * Falls back to a color swatch with the team abbreviation if the image fails to load.
 */
export default function TeamLogo({ team, size = 32, className = '' }) {
  const [errored, setErrored] = useState(false);

  if (!team) return null;

  const style = { width: size, height: size };

  if (errored) {
    return (
      <div
        className={`rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
        style={{ ...style, backgroundColor: team.color, fontSize: Math.max(8, size * 0.3) }}
      >
        {team.abbr.slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={getTeamLogoUrl(team.id)}
      alt={`${team.city} ${team.name} logo`}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`object-contain flex-shrink-0 ${className}`}
      style={style}
    />
  );
}
