'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/slovenia', label: 'Slovenia' },
  { href: '/world', label: 'World' },
  { href: '/seniors', label: 'Seniors' },
  { href: '/training', label: 'Training' },
  { href: '/planner', label: 'Planner' },
  { href: '/scorecard', label: 'Scorecard', ownerOnly: true },
  { href: '/archetypes', label: 'Archetypes' },
  { href: '/census', label: 'Census', ownerOnly: true },
  { href: '/settings', label: 'Settings', ownerOnly: true },
];

export default function Navbar({ guest = false }: { guest?: boolean }) {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-neutral-800">
      <span className="font-bold text-amber-500">BB Scout</span>
      {LINKS.filter((l) => !(guest && l.ownerOnly)).map(({ href, label }) => (
        <Link key={href} href={href}
          className={pathname.startsWith(href) ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'}>
          {label}
        </Link>
      ))}
      <span className="ml-auto text-xs text-neutral-600">v2</span>
    </nav>
  );
}
