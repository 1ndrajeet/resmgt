"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navItems = [
    { name: 'Classes', href: '/dashboard/classes' },
    { name: 'Subjects', href: '/dashboard/subjects' },
    { name: 'Students', href: '/dashboard/students' },
    { name: 'Marks', href: '/dashboard/marks' },
    { name: 'Reports', href: '/dashboard/reports' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Menu</h2>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('block p-2 rounded hover:bg-gray-700')}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}