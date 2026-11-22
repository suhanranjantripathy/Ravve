import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, BookMarked, BookOpen, Users } from 'lucide-react';

export default function MobileNav() {
  const items = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Shelves', path: '/shelves', icon: BookMarked },
    { label: 'Reading', path: '/currently-reading', icon: BookOpen },
    { label: 'Community', path: '/community', icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-warm-50/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-warm-200 dark:border-stone-800 px-2 py-1.5 flex items-center justify-around transition-colors">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-forest-800 dark:text-emerald-400 font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
