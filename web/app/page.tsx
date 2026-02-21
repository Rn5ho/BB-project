"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg" style={{ color: "var(--accent)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "var(--accent)" }}
          >
            BB Scout
          </h1>
          <p className="text-gray-400 mb-8">
            National Team Player Tracker for BuzzerBeater
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ background: "var(--accent)" }}
          >
            Log In
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Track, compare, and scout players for your National Team
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md mx-auto px-6">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: "var(--accent)" }}
        >
          BB Scout
        </h1>
        <p className="text-gray-400 mb-8">Welcome back, {user.email}</p>
        <div className="space-y-3">
          <Link
            href="/slovenia"
            className="block px-8 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ background: "var(--accent)" }}
          >
            Slovenia
          </Link>
          <Link
            href="/opponents"
            className="block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            Opponents
          </Link>
          <Link
            href="/compare"
            className="block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            Compare Players
          </Link>
          <Link
            href="/training"
            className="block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            Training Simulator
          </Link>
          <Link
            href="/scout"
            className="block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            Scout
          </Link>
          <Link
            href="/manual-entry"
            className="block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            Manual Entry
          </Link>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
          }}
          className="mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
