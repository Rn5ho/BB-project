"use client";

import { useEffect, useState } from "react";

const CACHE_KEY = "bb_current_season";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function useCurrentSeason(): { currentSeason: number | null; loading: boolean } {
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { season, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          setCurrentSeason(season);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to fetch
      }
    }

    (async () => {
      try {
        const res = await fetch("/api/scout/seasons");
        if (res.ok) {
          const data = await res.json();
          if (data.currentSeason) {
            setCurrentSeason(data.currentSeason);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ season: data.currentSeason, timestamp: Date.now() })
            );
          }
        }
      } catch {
        // non-fatal: currentSeason stays null, ages display as captured
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { currentSeason, loading };
}
