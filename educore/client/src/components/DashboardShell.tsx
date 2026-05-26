// ============================================================
// EduCore: Dashboard Shell Layout
// File: educore/client/src/components/DashboardShell.tsx
// Shared wrapper for all role dashboards
// Blueprint tokens: brand.primary #312e81, brand.secondary #4f46e5
// ============================================================

import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useOffline } from '../hooks/useOffline';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Overview',  path: '/dashboard/admin',         icon: '▦' },
    { label: 'Users',     path: '/dashboard/admin/users',   icon: '◈' },
    { label: 'Schedule',  path: '/dashboard/admin/schedule',icon: '◷' },
    { label: 'Students',  path: '/dashboard/admin/students',icon: '◉' },
  ],
  TEACHER: [
    { label: 'Overview',  path: '/dashboard/teacher',        icon: '▦' },
    { label: 'Marks',     path: '/dashboard/teacher/marks',  icon: '✎' },
    { label: 'Syllabus',  path: '/dashboard/teacher/syllabus',icon: '☰' },
  ],
  HOMEROOM_TEACHER: [
    { label: 'Roster',    path: '/dashboard/homeroom',         icon: '◉' },
    { label: 'Behaviour', path: '/dashboard/homeroom/behaviour',icon: '◈' },
    { label: 'Cards',     path: '/dashboard/homeroom/cards',   icon: '▣' },
  ],
  STUDENT: [
    { label: 'My Profile',path: '/dashboard/student',         icon: '◉' },
    { label: 'My QR',     path: '/dashboard/student/qr',      icon: '▩' },
  ],
  LIBRARY_ASSISTANT: [
    { label: 'Scanner',   path: '/dashboard/library',          icon: '▩' },
    { label: 'Catalogue', path: '/dashboard/library/catalogue',icon: '☰' },
  ],
  MEAL_RECORDER: [
    { label: 'Log Meals', path: '/dashboard/meals',            icon: '◈' },
    { label: 'History',   path: '/dashboard/meals/history',    icon: '◷' },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:             'Administrator',
  TEACHER:           'Teacher',
  HOMEROOM_TEACHER:  'Homeroom Teacher',
  STUDENT:           'Student',
  LIBRARY_ASSISTANT: 'Library Assistant',
  MEAL_RECORDER:     'Meal Recorder',
};

interface Props { children: ReactNode; title: string; }

export default function DashboardShell({ children, title }: Props) {
  const { appUser, signOut } = useAuth();
  const isOffline = useOffline();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!appUser) return null;

  const navItems = NAV_BY_ROLE[appUser.role] ?? [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'DM Mono', monospace" }}>

      {/* ── Offline banner ── */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-mono text-center py-1 px-4 tracking-widest uppercase">
          ● Offline — changes queued locally
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="bg-indigo-950 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 flex flex-col justify-center gap-1.5 active:scale-95 transition-transform"
            aria-label="Menu"
          >
            <span className={`block h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
          <div>
            <p className="text-xs text-indigo-300 tracking-widest uppercase leading-none">
              {appUser.tenant.name}
            </p>
            <p className="text-sm font-semibold leading-tight">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline dot */}
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <div className="text-right">
            <p className="text-xs text-indigo-300 leading-none">{ROLE_LABELS[appUser.role]}</p>
            <p className="text-xs font-medium truncate max-w-[100px]">{appUser.fullName}</p>
          </div>
        </div>
      </header>

      {/* ── Slide-out nav ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 bg-indigo-950 h-full flex flex-col shadow-2xl">
            <div className="px-5 py-6 border-b border-indigo-800">
              <p className="text-indigo-300 text-xs tracking-widest uppercase">EduCore</p>
              <p className="text-white font-semibold mt-1">{appUser.fullName}</p>
              <p className="text-indigo-400 text-xs">{appUser.email}</p>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors active:scale-[0.98]
                    ${location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-200 hover:bg-indigo-900'
                    }`}
                >
                  <span className="text-lg w-5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-5 py-4 border-t border-indigo-800">
              <button
                onClick={signOut}
                className="w-full text-rose-400 text-sm py-2 text-left hover:text-rose-300 transition-colors active:scale-[0.98]"
              >
                ⎋ Sign out
              </button>
            </div>
          </div>

          {/* backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 px-4 py-5 max-w-2xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
