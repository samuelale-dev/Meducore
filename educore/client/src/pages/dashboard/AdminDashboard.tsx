// ============================================================
// EduCore: Admin Dashboard
// File: src/pages/dashboard/AdminDashboard.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import { tenantApi, studentsApi } from '../../services/api';

type UserRole =
  | 'ADMIN' | 'TEACHER' | 'HOMEROOM_TEACHER'
  | 'STUDENT' | 'LIBRARY_ASSISTANT' | 'MEAL_RECORDER';

interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

const ALL_ROLES: UserRole[] = [
  'ADMIN','TEACHER','HOMEROOM_TEACHER',
  'STUDENT','LIBRARY_ASSISTANT','MEAL_RECORDER',
];

// ─── Role badge colours ───────────────────────────────────────────────────
const ROLE_STYLE: Record<UserRole, { bg: string; color: string; border: string }> = {
  ADMIN:             { bg:'rgba(224,92,92,0.1)',   color:'#e05c5c', border:'rgba(224,92,92,0.25)' },
  TEACHER:           { bg:'rgba(139,92,246,0.1)',  color:'#a78bfa', border:'rgba(139,92,246,0.25)' },
  HOMEROOM_TEACHER:  { bg:'rgba(168,85,247,0.1)',  color:'#c084fc', border:'rgba(168,85,247,0.25)' },
  STUDENT:           { bg:'rgba(78,201,148,0.1)',  color:'#4ec994', border:'rgba(78,201,148,0.25)' },
  LIBRARY_ASSISTANT: { bg:'rgba(201,168,76,0.12)', color:'#c9a84c', border:'rgba(201,168,76,0.28)' },
  MEAL_RECORDER:     { bg:'rgba(96,165,250,0.1)',  color:'#7ec8f5', border:'rgba(96,165,250,0.25)' },
};

// ─── Shared style tokens ──────────────────────────────────────────────────
const FONT_DISPLAY = "'Cormorant Garamond', Georgia, serif";
const FONT_MONO    = "'Space Mono', 'Courier New', monospace";

const glass: React.CSSProperties = {
  background:       'rgba(255,255,255,0.045)',
  backdropFilter:   'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border:           '1px solid rgba(255,255,255,0.08)',
  borderRadius:     18,
};
const glassHi: React.CSSProperties = {
  ...glass,
  border:     '1px solid rgba(201,168,76,0.35)',
  boxShadow:  '0 0 0 1px rgba(201,168,76,0.06) inset, 0 24px 64px rgba(0,0,0,0.45), 0 0 60px rgba(201,168,76,0.05)',
};

// ─── Inline CSS injected once ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Space+Mono:wght@400;700&display=swap');

  .admin-root {
    min-height: 100%;
    background: transparent;
    padding: 20px 0 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 680px;
    margin: 0 auto;
  }

  /* Background mesh applied to body when this page is mounted */
  .admin-bg-active {
    background: #08080f !important;
    background-image:
      radial-gradient(ellipse 80% 60% at 15% 20%, rgba(201,168,76,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 85% 75%, rgba(100,80,200,0.08) 0%, transparent 60%),
      linear-gradient(rgba(201,168,76,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.022) 1px, transparent 1px) !important;
    background-size: auto, auto, 52px 52px, 52px 52px !important;
  }

  .stat-card {
    padding: 16px 18px;
    border-radius: 16px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
    cursor: default;
  }
  .stat-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; border-radius: 2px 0 0 2px;
  }
  .stat-label {
    font-family: ${FONT_MONO};
    font-size: 8.5px;
    letter-spacing: 0.22em;
    color: rgba(240,236,227,0.35);
    text-transform: uppercase;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .stat-val {
    font-family: ${FONT_DISPLAY};
    font-size: 36px;
    font-weight: 300;
    color: #f0ece3;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .stat-tenant {
    font-family: ${FONT_MONO};
    font-size: 11px;
    color: #c9a84c;
    font-weight: 700;
    letter-spacing: 0.05em;
    line-height: 1.4;
    word-break: break-all;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .panel-title {
    font-family: ${FONT_DISPLAY};
    font-size: 19px;
    font-weight: 600;
    color: #f0ece3;
    letter-spacing: 0.01em;
  }

  .btn-add {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    background: rgba(201,168,76,0.14);
    border: 1px solid rgba(201,168,76,0.28);
    color: #c9a84c;
    font-family: ${FONT_MONO};
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-add:hover {
    background: rgba(201,168,76,0.22);
    box-shadow: 0 0 18px rgba(201,168,76,0.18);
  }

  .form-section {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(255,255,255,0.02);
  }
  .glass-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    color: #f0ece3;
    font-family: ${FONT_MONO};
    font-size: 12px;
    letter-spacing: 0.03em;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .glass-input::placeholder { color: rgba(240,236,227,0.2); }
  .glass-input:focus {
    border-color: rgba(201,168,76,0.45);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.07);
  }
  .glass-input option { background: #12121e; }

  .btn-primary {
    width: 100%;
    padding: 13px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(201,168,76,0.9), rgba(180,140,50,0.9));
    color: #0a0810;
    font-family: ${FONT_MONO};
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 0 28px rgba(201,168,76,0.22), inset 0 1px 0 rgba(255,255,255,0.22);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    opacity: 0.88;
    box-shadow: 0 0 44px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.22);
  }
  .btn-primary:active:not(:disabled) { transform: scale(0.985); }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .err-text {
    font-family: ${FONT_MONO};
    font-size: 10.5px;
    color: #e05c5c;
    letter-spacing: 0.05em;
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s;
  }
  .user-row:last-child { border-bottom: none; }
  .user-row:hover { background: rgba(255,255,255,0.02); }

  .user-ava {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.04));
    border: 1px solid rgba(201,168,76,0.14);
    display: flex; align-items: center; justify-content: center;
    font-family: ${FONT_DISPLAY};
    font-size: 13px; font-weight: 600; color: #c9a84c;
    flex-shrink: 0;
  }
  .user-name {
    font-family: ${FONT_DISPLAY};
    font-size: 14px; font-weight: 600;
    color: #f0ece3; letter-spacing: 0.01em;
  }
  .user-email {
    font-family: ${FONT_MONO};
    font-size: 10px; color: rgba(240,236,227,0.28);
    letter-spacing: 0.04em; margin-top: 1px;
  }

  .role-badge {
    display: inline-flex; align-items: center;
    padding: 4px 10px;
    border-radius: 99px;
    font-family: ${FONT_MONO};
    font-size: 8.5px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid;
    white-space: nowrap;
  }

  .empty-state {
    padding: 36px 20px;
    text-align: center;
    font-family: ${FONT_MONO};
    font-size: 11px;
    color: rgba(240,236,227,0.2);
    letter-spacing: 0.1em;
  }

  .panel-foot {
    padding: 10px 20px;
    border-top: 1px solid rgba(255,255,255,0.04);
    font-family: ${FONT_MONO};
    font-size: 9px; letter-spacing: 0.14em;
    color: rgba(240,236,227,0.18); text-transform: uppercase;
  }

  .spin-sm {
    display: inline-block;
    width: 12px; height: 12px;
    border: 2px solid rgba(10,8,16,0.3);
    border-top-color: rgba(10,8,16,0.85);
    border-radius: 50%;
    animation: admin-spin 0.7s linear infinite;
  }
  @keyframes admin-spin { to { transform: rotate(360deg); } }

  .loading-pulse {
    padding: 36px;
    display: flex; align-items: center; justify-content: center;
  }
  .loading-pulse-ring {
    width: 28px; height: 28px;
    border: 2px solid rgba(201,168,76,0.2);
    border-top-color: rgba(201,168,76,0.7);
    border-radius: 50%;
    animation: admin-spin 0.8s linear infinite;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { session, appUser } = useAuth();
  const token = session?.access_token ?? '';

  const [users, setUsers]             = useState<AppUser[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ email: '', fullName: '', role: 'TEACHER' as UserRole });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // Inject styles once
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'admin-dashboard-styles';
    el.textContent = STYLES;
    if (!document.getElementById('admin-dashboard-styles')) {
      document.head.appendChild(el);
    }
    return () => { document.getElementById('admin-dashboard-styles')?.remove(); };
  }, []);

  useEffect(() => {
    Promise.all([
      tenantApi.listUsers(token),
      studentsApi.list(token),
    ]).then(([u, s]: any) => {
      setUsers(u);
      setStudentCount(Array.isArray(s) ? s.length : 0);
    }).finally(() => setLoading(false));
  }, [token]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const newUser: any = await tenantApi.createUser(token, form);
      setUsers(u => [newUser, ...u]);
      setShowForm(false);
      setForm({ email: '', fullName: '', role: 'TEACHER' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const stats = [
    { label: 'Total Users', value: users.length,                                  accent: '#c9a84c', icon: '👥' },
    { label: 'Students',    value: studentCount,                                   accent: '#4ec994', icon: '🎓' },
    { label: 'Staff',       value: users.filter(u => u.role !== 'STUDENT').length, accent: '#7ec8f5', icon: '👔' },
    { label: 'Tenant',      value: null, tenant: appUser?.tenant?.subdomain ?? '—', accent: '#f59e0b', icon: '🏫' },
  ];

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '??';

  return (
    <DashboardShell title="Admin Panel">
      <div className="admin-root">

        {/* ── Stats grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card" style={{ ...glass }}>
              <style>{`.stat-card[data-key="${s.label}"]::before { background: ${s.accent}; }`}</style>
              {/* left accent via inline pseudo workaround */}
              <div style={{
                position:'absolute', left:0, top:0, bottom:0, width:2,
                background: s.accent, borderRadius:'2px 0 0 2px'
              }} />
              <div className="stat-label">
                {s.label}
                <span style={{ fontSize:13, opacity:0.45 }}>{s.icon}</span>
              </div>
              {s.tenant !== undefined
                ? <div className="stat-tenant">{loading ? '—' : s.tenant}</div>
                : <div className="stat-val">{loading ? '—' : s.value}</div>
              }
            </div>
          ))}
        </div>

        {/* ── Users panel ── */}
        <div style={{ ...glassHi, overflow:'hidden' }}>

          <div className="panel-head">
            <h2 className="panel-title">Users</h2>
            <button
              className="btn-add"
              onClick={() => { setShowForm(o => !o); setError(''); }}
            >
              {showForm ? '✕ Cancel' : '+ Add User'}
            </button>
          </div>

          {/* Add user form */}
          {showForm && (
            <form onSubmit={handleCreateUser} className="form-section">
              {error && <p className="err-text">⚠ {error}</p>}

              <input
                className="glass-input"
                placeholder="Full name"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
              <input
                type="email"
                className="glass-input"
                placeholder="Email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <select
                className="glass-input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              >
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <span className="spin-sm" /> : null}
                {saving ? 'Creating…' : 'Create User →'}
              </button>
            </form>
          )}

          {/* User list */}
          {loading ? (
            <div className="loading-pulse">
              <div className="loading-pulse-ring" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users yet</div>
          ) : (
            <ul style={{ listStyle:'none', margin:0, padding:0 }}>
              {users.map(u => {
                const rs = ROLE_STYLE[u.role];
                return (
                  <li key={u.id} className="user-row">
                    <div className="user-ava">{initials(u.fullName)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="user-name">{u.fullName}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                    <span
                      className="role-badge"
                      style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}
                    >
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="panel-foot">
            {users.length} user{users.length !== 1 ? 's' : ''} total
          </div>
        </div>

      </div>
    </DashboardShell>
  );
                      }    <DashboardShell title="Admin Panel">
      <div className="space-y-5">

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.accent} shadow-sm`}>
              <p className="text-xs text-slate-400 tracking-widest uppercase">{s.label}</p>
              <p className={`font-bold text-indigo-950 mt-1 ${s.small ? 'text-base' : 'text-2xl'}`}>
                {loading ? '—' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Users section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-indigo-950 tracking-wide">Users</h2>
            <button
              onClick={() => setShowForm(o => !o)}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg active:scale-[0.98] transition-transform"
            >
              {showForm ? '✕ Cancel' : '+ Add User'}
            </button>
          </div>

          {/* Add user form */}
          {showForm && (
            <form onSubmit={handleCreateUser} className="px-4 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Full name"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
              <input
                type="email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              >
                {(['ADMIN','TEACHER','HOMEROOM_TEACHER','STUDENT','LIBRARY_ASSISTANT','MEAL_RECORDER'] as UserRole[]).map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </form>
          )}

          {/* User list */}
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No users yet</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {users.map(u => (
                <li key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-indigo-950">{u.fullName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
