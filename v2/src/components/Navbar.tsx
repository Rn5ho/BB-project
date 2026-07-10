'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/slovenia', label: 'Slovenia' },
  { href: '/world', label: 'World' },
  { href: '/archetypes', label: 'Archetypes' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-neutral-800">
      <span className="font-bold text-amber-500">BB Scout</span>
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href}
          className={pathname.startsWith(href) ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'}>
          {label}
        </Link>
      ))}
      <span className="ml-auto text-xs text-neutral-600">v2</span>
    </nav>
  );
}
