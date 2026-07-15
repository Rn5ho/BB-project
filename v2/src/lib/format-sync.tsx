import React from 'react';

/** Format a UTC Date as "MMM D, HH:mm" e.g. "Jul 11, 06:00" */
export function formatStartedAt(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mm = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mm} ${day}, ${hh}:${min}`;
}

/** Duration between two dates as "38s" or "2m 4s"; "–" if end is null. */
export function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '–';
  const secs = Math.round((end.getTime() - start.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export type SyncCounts = Record<string, unknown> | null;

/** Render a human-readable summary of a sync result. Returns JSX. */
export function formatSyncResult(
  jobType: string,
  counts: SyncCounts,
  error: string | null,
): React.ReactNode {
  if (error) {
    const msg = error.length > 80 ? error.slice(0, 77) + '…' : error;
    return <span className="text-red-400">{msg}</span>;
  }

  const n = (key: string): number => {
    if (!counts) return 0;
    const v = counts[key];
    return typeof v === 'number' ? v : 0;
  };
  const b = (key: string): boolean => {
    if (!counts) return false;
    return !!counts[key];
  };

  if (jobType === 'seasons') {
    const seasons = n('seasons');
    return <span>{seasons} season{seasons !== 1 ? 's' : ''} synced</span>;
  }

  if (jobType === 'market') {
    const newPlayers = n('newPlayers');
    const captured = n('snapshotsInserted');
    const refreshed = n('snapshotsUpdated');
    const totalListed = n('totalListed');
    const hitPageCap = b('hitPageCap');

    const parts: React.ReactNode[] = [];
    if (newPlayers > 0) parts.push(`${newPlayers} new`);
    parts.push(`${captured} captured`);
    if (totalListed > 0) parts.push(`${totalListed} on market`);
    if (refreshed > 0) parts.push(`${refreshed} refreshed`);

    const joined = parts.join(' · ');
    return (
      <span>
        {joined}
        {hitPageCap && <span className="text-red-400"> · hit page cap</span>}
      </span>
    );
  }

  if (jobType === 'minutes') {
    const clubsSynced = n('clubsSynced');
    const matchesDiscovered = n('matchesDiscovered');
    const boxscoresFetched = n('boxscoresFetched');
    const minutesRows = n('minutesRows');
    const matchesRemaining = n('matchesRemaining');

    const parts: string[] = [];
    if (clubsSynced > 0) parts.push(`${clubsSynced} club${clubsSynced !== 1 ? 's' : ''} synced`);
    if (matchesDiscovered > 0) parts.push(`${matchesDiscovered} match${matchesDiscovered !== 1 ? 'es' : ''} found`);
    parts.push(`${boxscoresFetched} boxscore${boxscoresFetched !== 1 ? 's' : ''} fetched`);
    if (minutesRows > 0) parts.push(`${minutesRows} minutes row${minutesRows !== 1 ? 's' : ''}`);

    return (
      <span>
        {parts.join(' · ') || '—'}
        {matchesRemaining > 0 && <span className="text-neutral-500"> · {matchesRemaining} remaining</span>}
      </span>
    );
  }

  if (jobType === 'players') {
    const countries = n('countriesSynced');
    const apiPlayers = n('apiPlayers');
    const newPlayers = n('newPlayers');
    const refreshed = n('snapshotsUpdated');

    const parts: string[] = [];
    if (countries > 0) parts.push(`${countries} countr${countries !== 1 ? 'ies' : 'y'}`);
    if (apiPlayers > 0) parts.push(`${apiPlayers} players`);
    if (newPlayers > 0) parts.push(`${newPlayers} new`);
    if (refreshed > 0) parts.push(`${refreshed} refreshed`);

    return <span>{parts.join(' · ') || '—'}</span>;
  }

  if (jobType === 'inference') {
    const pops = n('popsDetected');
    const windows = n('observationWindows');
    const high = n('inferredHigh');
    const medium = n('inferredMedium');
    const parts: string[] = [];
    parts.push(`${pops} pop${pops !== 1 ? 's' : ''}`);
    parts.push(`${windows} club window${windows !== 1 ? 's' : ''}`);
    if (high + medium > 0) parts.push(`${high} high · ${medium} medium`);
    return <span>{parts.join(' · ')}</span>;
  }

  // Unknown job type — compact JSON fallback
  return <span>{JSON.stringify(counts ?? {})}</span>;
}
