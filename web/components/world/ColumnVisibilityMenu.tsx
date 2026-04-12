"use client";

import { useState, useRef, useEffect } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
}

interface Props {
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  onChange: (visible: Record<string, boolean>) => void;
}

export function ColumnVisibilityMenu({ columns, visible, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-xs text-gray-300 hover:text-white transition-colors"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        title="Column visibility"
      >
        ⋮ Columns
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 rounded-md p-2 z-20 min-w-[180px]"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {columns.map((col) => (
            <label
              key={col.key}
              className={`flex items-center gap-2 px-2 py-1 text-xs rounded ${
                col.alwaysVisible ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={col.alwaysVisible ? true : !!visible[col.key]}
                disabled={col.alwaysVisible}
                onChange={(e) =>
                  onChange({ ...visible, [col.key]: e.target.checked })
                }
              />
              <span className="text-gray-200">{col.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
