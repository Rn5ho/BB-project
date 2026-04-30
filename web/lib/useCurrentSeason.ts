"use client";

import { useCallback, useEffect, useState } from "react";

const CACHE_KEY = "bb_current_season";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedSeason = { season: number; finish: string | null; timestamp: number };

function readCache(): CachedSeason | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.season !== "number") return null;
    return {
      season: parsed.season,
      finish: typeof parsed.finish === "string" ? parsed.finish : null,
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : 0,
    };
  } catch {
    return null;
  }
}

function isCacheFresh(cached: CachedSeason): boolean {
  if (Date.now() - cached.timestamp >= CACHE_TTL_MS) return false;
  if (cached.finish) {
    const finishMs = new Date(cached.finish).getTime();
    if (Number.isFinite(finishMs) && Date.now() > finishMs) return false;
  }
  return true;
}

export function useCurrentSeason(): {
  currentSeason: number | null;
  loading: boolean;
  refresh: () => void;
} {
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached && isCacheFresh(cached)) {
      setCurrentSeason(cached.season);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/scout/seasons");
        if (res.ok) {
          const data = await res.json();
          if (data.currentSeason && !cancelled) {
            setCurrentSeason(data.currentSeason);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                season: data.currentSeason,
                finish: data.currentFinish ?? null,
                timestamp: Date.now(),
              })
            );
          }
        }
      } catch {
        // non-fatal: currentSeason stays null, ages display as captured
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  return { currentSeason, loading, refresh };
}
