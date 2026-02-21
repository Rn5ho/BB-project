"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/slovenia", label: "Slovenia" },
  { href: "/opponents", label: "Opponents" },
  { href: "/compare", label: "Compare" },
  { href: "/training", label: "Training" },
  { href: "/scout", label: "Scout" },
  { href: "/manual-entry", label: "Manual Entry" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-bold"
            style={{ color: "var(--accent)" }}
          >
            BB Scout
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  style={
                    isActive
                      ? { background: "var(--accent)" }
                      : {}
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
