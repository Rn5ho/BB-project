'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={formAction} className="flex flex-col gap-3 w-64">
        <h1 className="text-xl font-semibold text-center">BB Scout</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
        <button disabled={pending} className="rounded bg-amber-600 py-2 font-medium disabled:opacity-50">
          {pending ? '…' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
