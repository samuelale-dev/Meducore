// ============================================================
// EduCore: Dashboard Shell
// File: src/components/DashboardShell.tsx
// ============================================================

import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useOffline } from '../hooks/useOffline';

interface NavItem { label: string; path: string; icon: string; }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Overview',  path: '/dashboard/admin',          icon: '◈' },
    { label: 'Users',     path: '/dashboard/admin/users',    icon: '👥' },
    { label: 'Students',  path: '/dashboard/admin/students', icon: '🎓' },
    { label: 'Schedule',  path: '/dashboard/admin/schedule', icon: '📅' },
    { label: 'QR Scanner',path: '/dashboard/admin/qr',       icon: '▩' },
    { label: 'Settings',  path: '/dashboard/admin/settings', icon: '⚙' },
  ],
  TEACHER: [
    { label: 'Overview',  path: '/dashboard/teacher',         icon: '◈' },
    { label: 'Marks',     path: '/dashboard/teacher/marks',   icon: '✎' },
    { label: 'Syllabus',  path: '/dashboard/teacher/syllabus',icon: '☰' },
  ],
  HOMEROOM_TEACHER: [
    { label: 'Roster',    path: '/dashboard/homeroom',          icon: '◉' },
    { label: 'Behaviour', path: '/dashboard/homeroom/behaviour',icon: '◈' },
    { label: 'Cards',     path: '/dashboard/homeroom/cards',    icon: '▣' },
  ],
  STUDENT: [
    { label: 'My Profile',path: '/dashboard/student',    icon: '◉' },
    { label: 'My QR',     path: '/dashboard/student/qr', icon: '▩' },
  ],
  LIBRARY_ASSISTANT: [
    { label: 'Scanner',   path: '/dashboard/library',           icon: '▩' },
    { label: 'Catalogue', path: '/dashboard/library/catalogue', icon: '☰' },
  ],
  MEAL_RECORDER: [
    { label: 'Log Meals', path: '/dashboard/meals',         icon: '◈' },
    { label: 'History',   path: '/dashboard/meals/history', icon: '◷' },
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

const FD = "'Cormorant Garamond', Georgia, serif";
const FM = "'Space Mono', 'Courier New', monospace";

const SHELL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Space+Mono:wght@400;700&display=swap');

  /* ── Root ── */
  .shell-root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #08080f;
    background-image:
      radial-gradient(ellipse 90% 60% at 10% 10%, rgba(201,168,76,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 70% 80% at 90% 80%, rgba(80,60,200,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 50% at 50% 40%, rgba(14,165,233,0.04) 0%, transparent 65%),
      linear-gradient(rgba(201,168,76,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.018) 1px, transparent 1px);
    background-size: auto, auto, auto, 52px 52px, 52px 52px;
    font-family: ${FM};
    color: #f0ece3;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Offline banner ── */
  .shell-offline {
    background: rgba(245,158,11,0.18);
    border-bottom: 1px solid rgba(245,158,11,0.3);
    color: #fbbf24;
    font-family: ${FM};
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-align: center;
    padding: 7px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .shell-offline-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #fbbf24;
    animation: shell-pulse 1.5s ease-in-out infinite;
  }
  @keyframes shell-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.7); }
}
  /* ── Header ── */
  .shell-header {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px;
    height: 58px;
    background: rgba(8,8,15,0.82);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    box-shadow: 0 1px 0 rgba(201,168,76,0.06);
  }
  .shell-header-left {
    display: flex; align-items: center; gap: 12px;
  }
  .shell-hamburger {
    display: flex; flex-direction: column; gap: 4.5px;
    padding: 6px; cursor: pointer; background: none; border: none;
  }
  .shell-hamburger span {
    display: block; width: 18px; height: 1.5px;
    background: rgba(201,168,76,0.7);
    border-radius: 2px;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    transform-origin: center;
  }
  .shell-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
  .shell-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .shell-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }

  .shell-brand-school {
    font-family: ${FM};
    font-size: 7.5px;
    letter-spacing: 0.22em;
    color: rgba(201,168,76,0.5);
    text-transform: uppercase;
    line-height: 1;
  }
  .shell-brand-title {
    font-family: ${FD};
    font-size: 16px; font-weight: 600;
    color: #f0ece3; line-height: 1.2;
    letter-spacing: 0.01em;
  }
  .shell-header-right {
    display: flex; align-items: center; gap: 10px;
  }
  .shell-status {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 10px 5px 6px;
    border-radius: 99px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
  }
  .shell-status-ava {
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(201,168,76,0.4), rgba(201,168,76,0.1));
    border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: ${FD};
    font-size: 9px; font-weight: 600; color: #c9a84c;
  }
  .shell-status-role {
    font-size: 7px; letter-spacing: 0.18em;
    color: rgba(240,236,227,0.3); text-transform: uppercase;
    line-height: 1;
  }
  .shell-status-name {
    font-family: ${FD};
    font-size: 12px; font-weight: 600;
    color: #f0ece3; line-height: 1.1;
    max-width: 80px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .shell-online-dot {
    width: 5px; height: 5px; border-radius: 50%;
    animation: shell-pulse 2.5s ease-in-out infinite;
  }

  /* ── Sidebar overlay ── */
  .shell-backdrop {
    position: fixed; inset: 0; z-index: 45;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: shell-fade-in 0.2s ease both;
  }
  @keyframes shell-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
    /* ── Sidebar ── */
  .shell-sidebar {
    position: fixed; left: 0; top: 0; bottom: 0;
    width: 260px; z-index: 50;
    background: rgba(6,6,12,0.97);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-right: 1px solid rgba(201,168,76,0.12);
    display: flex; flex-direction: column;
    animation: shell-slide-in 0.28s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 4px 0 40px rgba(0,0,0,0.6);
  }
  @keyframes shell-slide-in {
    from { transform: translateX(-100%); opacity: 0.4; }
    to   { transform: translateX(0);     opacity: 1; }
  }

  .shell-sidebar-head {
    padding: 22px 18px 18px;
    border-bottom: 1px solid rgba(201,168,76,0.08);
  }
  .shell-sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }
  .shell-sidebar-mark {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.28), rgba(201,168,76,0.06));
    border: 1px solid rgba(201,168,76,0.28);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 20px rgba(201,168,76,0.12);
  }
  .shell-sidebar-appname {
    font-family: ${FD};
    font-size: 17px; font-weight: 600; color: #f0ece3;
  }
  .shell-sidebar-appname small {
    display: block;
    font-family: ${FM};
    font-size: 7.5px; letter-spacing: 0.2em;
    color: rgba(201,168,76,0.4);
    text-transform: uppercase; margin-top: 1px;
    font-style: normal;
  }
  .shell-sidebar-user-name {
    font-family: ${FD};
    font-size: 15px; font-weight: 600; color: #f0ece3;
  }
  .shell-sidebar-user-email {
    font-family: ${FM};
    font-size: 9.5px; color: rgba(240,236,227,0.28);
    letter-spacing: 0.04em; margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .shell-sidebar-role-pill {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 8px; padding: 4px 10px;
    border-radius: 99px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.2);
    font-family: ${FM};
    font-size: 8px; letter-spacing: 0.16em;
    color: #c9a84c; text-transform: uppercase;
  }

  .shell-nav { flex:1; padding: 10px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
  .shell-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    font-family: ${FM};
    font-size: 11.5px; letter-spacing: 0.05em;
    color: rgba(240,236,227,0.4);
    border: 1px solid transparent;
    cursor: pointer; background: none;
    transition: all 0.18s; text-align: left; width: 100%;
  }
  .shell-nav-item:hover { background: rgba(255,255,255,0.04); color: #f0ece3; }
  .shell-nav-item.active {
    background: rgba(201,168,76,0.1);
    border-color: rgba(201,168,76,0.2);
    color: #c9a84c;
  }
  .shell-nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }

  .shell-sidebar-foot {
    padding: 12px 10px 20px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .shell-tenant-chip {
    padding: 10px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 6px;
  }
  .shell-tenant-label {
    font-size: 7.5px; letter-spacing: 0.2em;
    color: rgba(240,236,227,0.2); text-transform: uppercase;
  }
  .shell-tenant-val {
    font-family: ${FM};
    font-size: 11px; color: #c9a84c;
    letter-spacing: 0.06em; margin-top: 2px;
  }
  .shell-signout {
    width: 100%; padding: 10px 12px;
    border-radius: 10px; background: transparent;
    border: 1px solid transparent;
    color: rgba(224,92,92,0.45);
    font-family: ${FM};
    font-size: 11px; letter-spacing: 0.1em;
    text-align: left; cursor: pointer;
    transition: all 0.18s;
    display: flex; align-items: center; gap: 8px;
  }
  .shell-signout:hover {
    background: rgba(224,92,92,0.08);
    border-color: rgba(224,92,92,0.18);
    color: #e05c5c;
  }

  /* ── Main ── */
  .shell-main {
    flex: 1;
    padding: 20px 16px 48px;
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
  }
`;

interface Props { children: ReactNode; title: string; }

export default function DashboardShell({ children, title }: Props) {
  const { appUser, signOut } = useAuth();
  const isOffline = useOffline();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'shell-styles';
    el.textContent = SHELL_STYLES;
    if (!document.getElementById('shell-styles')) document.head.appendChild(el);
    return () => { document.getElementById('shell-styles')?.remove(); };
  }, []);

  if (!appUser) return null;

  const navItems = NAV_BY_ROLE[appUser.role] ?? [];
  const initials = appUser.fullName
    .split(' ').map((n: string) => n[0]?.toUpperCase() ?? '').join('').slice(0, 2);

  return (
    <div className="shell-root">

      {/* Offline banner */}
      {isOffline && (
        <div className="shell-offline">
          <span className="shell-offline-dot" />
          Offline — changes queued locally
        </div>
      )}

      {/* Header */}
      <header className="shell-header">
        <div className="shell-header-left">
          <button
            className={`shell-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
          <div>
            <div className="shell-brand-school">{appUser.tenant.name}</div>
            <div className="shell-brand-title">{title}</div>
          </div>
        </div>

        <div className="shell-header-right">
          <div className="shell-status">
            <div className="shell-status-ava">{initials}</div>
            <div>
              <div className="shell-status-role">{ROLE_LABELS[appUser.role]}</div>
              <div className="shell-status-name">{appUser.fullName}</div>
            </div>
            <span
              className="shell-online-dot"
              style={{ background: isOffline ? '#fbbf24' : '#4ec994', boxShadow: `0 0 6px ${isOffline ? '#fbbf24' : '#4ec994'}` }}
            />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {menuOpen && (
        <>
          <div className="shell-backdrop" onClick={() => setMenuOpen(false)} />
          <nav className="shell-sidebar">
            <div className="shell-sidebar-head">
              <div className="shell-sidebar-logo">
                <div className="shell-sidebar-mark">🎓</div>
                <div className="shell-sidebar-appname">
                  EduCore Hub
                  <small>Admin Portal</small>
                </div>
              </div>
              <div className="shell-sidebar-user-name">{appUser.fullName}</div>
              <div className="shell-sidebar-user-email">{appUser.email}</div>
              <div className="shell-sidebar-role-pill">
                <span>●</span>{ROLE_LABELS[appUser.role]}
              </div>
            </div>

            <div className="shell-nav">
              {navItems.map(item => (
                <button
                  key={item.path}
                  className={`shell-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                >
                  <span className="shell-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="shell-sidebar-foot">
              <div className="shell-tenant-chip">
                <div className="shell-tenant-label">Tenant</div>
                <div className="shell-tenant-val">{appUser.tenant.subdomain}</div>
              </div>
              <button className="shell-signout" onClick={signOut}>
                ⇤ Sign out
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Page content */}
      <main className="shell-main">
        {children}
      </main>
    </div>
  );
}
