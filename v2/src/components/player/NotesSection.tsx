'use client';

import { useState, useTransition } from 'react';
import { addNote, deleteNote } from '@/app/players/[id]/actions';

export default function NotesSection({ playerId, notes }: { playerId: number; notes: { id: number; body: string; createdAt: string }[] }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note…"
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm" />
        <button disabled={pending || !text.trim()} onClick={() => start(async () => { await addNote(playerId, text); setText(''); })}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50">Add</button>
      </div>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="flex items-start gap-2 text-sm border border-neutral-800 rounded px-3 py-2">
            <div className="flex-1"><div>{n.body}</div><div className="text-xs text-neutral-500">{n.createdAt.slice(0, 16).replace('T', ' ')}</div></div>
            <button disabled={pending} onClick={() => start(async () => { await deleteNote(playerId, n.id); })} className="text-neutral-600 hover:text-red-400">×</button>
          </li>
        ))}
        {notes.length === 0 && <li className="text-sm text-neutral-500">No notes yet.</li>}
      </ul>
    </div>
  );
}
