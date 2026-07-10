'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Mounts when there is at least one requested/running census run.
 * Refreshes the page every 15 s so the status table stays current.
 */
export default function CensusLivePoller() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <span className="text-xs text-sky-500 animate-pulse">
      auto-refreshing every 15 s
    </span>
  );
}
