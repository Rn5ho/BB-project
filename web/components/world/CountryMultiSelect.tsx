"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  countries: string[];
  selected: string[];
  starred: string[];
  onChange: (selected: string[]) => void;
  onToggleStar: (country: string) => void;
}

export function CountryMultiSelect({ countries, selected, starred, onChange, onToggleStar }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedSet = new Set(selected);
  const starredSet = new Set(starred);
  const q = query.trim().toLowerCase();
  const filtered = countries
    .filter((c) => !selectedSet.has(c))
    .filter((c) => (q === "" ? true : c.toLowerCase().includes(q)))
    .sort((a, b) => a.localeCompare(b));

  function addCountry(c: string) {
    onChange([...selected, c]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeCountry(c: string) {
    onChange(selected.filter((x) => x !== c));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      removeCountry(selected[selected.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      addCountry(filtered[0]);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex flex-wrap gap-1 items-center px-2 py-1 rounded-md min-h-[34px]"
        style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selected.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white"
            style={{ background: "var(--accent)" }}
          >
            {c}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeCountry(c);
              }}
              className="hover:text-gray-200"
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length === 0 ? "Type to add country..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-white"
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {filtered.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5 cursor-pointer"
              onClick={() => addCountry(c)}
            >
              <span>{c}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(c);
                }}
                className="text-lg"
                title={starredSet.has(c) ? "Unstar (remove from Season Opponents)" : "Star (add to Season Opponents)"}
                style={{ color: starredSet.has(c) ? "var(--accent)" : "rgb(107 114 128)" }}
              >
                {starredSet.has(c) ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
