'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_MS = 15_000;
/** A run stuck in requested/running would otherwise poll forever in a forgotten tab,
 *  holding Neon's compute awake. Longest observed census is well under an hour. */
const MAX_POLLS = (2 * 60 * 60 * 1000) / REFRESH_MS;

/**
 * Mounts when there is at least one requested/running census run.
 * Refreshes the page every 15 s so the status table stays current, giving up
 * after 2 h so a stuck run doesn't poll indefinitely.
 */
export default function CensusLivePoller() {
  const router = useRouter();

  useEffect(() => {
    let polls = 0;
    const id = setInterval(() => {
      if (++polls > MAX_POLLS) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <span className="text-xs text-sky-500 animate-pulse">
      auto-refreshing every 15 s
    </span>
  );
}
