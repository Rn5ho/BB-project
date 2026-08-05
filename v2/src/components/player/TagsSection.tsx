'use client';

import { useState, useTransition } from 'react';
import { addTag, removeTag } from '@/app/players/[id]/actions';

export default function TagsSection({ playerId, tags, readOnly = false }: { playerId: number; tags: string[]; readOnly?: boolean }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-xs">
          {t}
          {!readOnly && <button disabled={pending} onClick={() => start(async () => { await removeTag(playerId, t); })} className="text-neutral-600 hover:text-red-400">×</button>}
        </span>
      ))}
      {!readOnly && <input value={text} onChange={(e) => setText(e.target.value)} placeholder="+ tag"
        onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) start(async () => { await addTag(playerId, text); setText(''); }); }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-xs w-24" />}
    </div>
  );
}
