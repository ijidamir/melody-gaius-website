'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'melody-theme'; // Same preference used by the public website.

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* The site must still work when storage is blocked. */ }
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

export default function AdminThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const sync = () => {
      const next = readTheme();
      document.documentElement.classList.toggle('light', next === 'light');
      setTheme(next);
    };
    sync();
    // Reflect changes made on other tabs, including the public website.
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function toggleTheme() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', next === 'light');
    setTheme(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Theme still works in this tab. */ }
  }

  const nextLabel = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className="admin-button admin-secondary shrink-0 gap-2"
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {showLabel && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
