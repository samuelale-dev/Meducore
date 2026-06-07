// ============================================================
// EduCore: Admin Dashboard
// File: src/pages/dashboard/AdminDashboard.tsx
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import { tenantApi, studentsApi } from '../../services/api';

type UserRole =
  | 'ADMIN' | 'TEACHER' | 'HOMEROOM_TEACHER'
  | 'STUDENT' | 'LIBRARY_ASSISTANT' | 'MEAL_RECORDER';

interface AppUser {
  id: string; email: string; fullName: string;
  role: UserRole; createdAt: string;
}

const ALL_ROLES: UserRole[] = [
  'ADMIN','TEACHER','HOMEROOM_TEACHER',
  'STUDENT','LIBRARY_ASSISTANT','MEAL_RECORDER',
];

const ROLE_STYLE: Record<UserRole, { bg:string; color:string; border:string }> = {
  ADMIN:             { bg:'rgba(224,92,92,0.12)',  color:'#e05c5c', border:'rgba(224,92,92,0.28)' },
  TEACHER:           { bg:'rgba(139,92,246,0.12)', color:'#a78bfa', border:'rgba(139,92,246,0.28)' },
  HOMEROOM_TEACHER:  { bg:'rgba(168,85,247,0.12)', color:'#c084fc', border:'rgba(168,85,247,0.28)' },
  STUDENT:           { bg:'rgba(78,201,148,0.12)', color:'#4ec994', border:'rgba(78,201,148,0.28)' },
  LIBRARY_ASSISTANT: { bg:'rgba(201,168,76,0.14)', color:'#c9a84c', border:'rgba(201,168,76,0.3)' },
  MEAL_RECORDER:     { bg:'rgba(96,165,250,0.12)', color:'#7ec8f5', border:'rgba(96,165,250,0.28)' },
};

const FD = "'Cormorant Garamond', Georgia, serif";
const FM = "'Space Mono', 'Courier New', monospace";

// ── Quick action definition ──────────────────────────────────────────────
interface QuickAction {
  icon: string; label: string; sub: string;
  color: string; glow: string; path: string;
}
const QUICK_ACTIONS: QuickAction[] = [
  { icon:'▩', label:'QR Scanner',  sub:'Scan student / meal QR',  color:'#c9a84c', glow:'rgba(201,168,76,0.3)',  path:'/dashboard/admin/qr' },
  { icon:'👥', label:'Add User',    sub:'Register new user',        color:'#a78bfa', glow:'rgba(139,92,246,0.3)',  path:'#add-user' },
  { icon:'🎓', label:'Students',   sub:'Browse student records',   color:'#4ec994', glow:'rgba(78,201,148,0.3)', path:'/dashboard/admin/students' },
  { icon:'📅', label:'Schedule',   sub:'Manage timetables',        color:'#7ec8f5', glow:'rgba(96,165,250,0.3)', path:'/dashboard/admin/schedule' },
  { icon:'📊', label:'Reports',    sub:'Analytics & exports',      color:'#f59e0b', glow:'rgba(245,158,11,0.3)', path:'/dashboard/admin/reports' },
  { icon:'⚙',  label:'Settings',   sub:'System configuration',     color:'#94a3b8', glow:'rgba(148,163,184,0.3)',path:'/dashboard/admin/settings' },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Space+Mono:wght@400;700&display=swap');

  .adm { display:flex; flex-direction:column; gap:22px; }

  /* ── Section label ── */
  .adm-sec {
    font-family: ${FM};
    font-size: 8.5px; letter-spacing: 0.26em;
    color: rgba(240,236,227,0.25); text-transform: uppercase;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 10px;
  }
  .adm-sec::after {
    content: ''; flex:1; height:1px;
    background: linear-gradient(90deg, rgba(201,168,76,0.15), transparent);
  }

  /* ── Stats grid ── */
  .adm-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-stat {
    padding: 16px 16px 14px;
    border-radius: 16px;
    background: rgba(255,255,255,0.042);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    position: relative; overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
    cursor: default;
  }
  .adm-stat:hover { border-color: rgba(201,168,76,0.18); transform: translateY(-1px); }
  .adm-stat-accent {
    position: absolute; left:0; top:0; bottom:0;
    width: 2px; border-radius: 2px 0 0 2px;
  }
  .adm-stat-top {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 10px;
  }
  .adm-stat-label {
    font-family: ${FM};
    font-size: 8px; letter-spacing: 0.2em;
    color: rgba(240,236,227,0.3); text-transform: uppercase;
  }
  .adm-stat-icon { font-size: 15px; opacity: 0.4; }
  .adm-stat-val {
    font-family: ${FD};
    font-size: 38px; font-weight: 300;
    color: #f0ece3; line-height: 1;
    letter-spacing: -0.02em;
  }
  .adm-stat-tenant {
    font-family: ${FM};
    font-size: 10.5px; color: #c9a84c;
    font-weight: 700; letter-spacing: 0.05em;
    line-height: 1.4; word-break: break-all;
  }
  .adm-stat-sub {
    font-family: ${FM};
    font-size: 8.5px; color: rgba(240,236,227,0.2);
    letter-spacing: 0.1em; margin-top: 4px;
  }

  /* ── Quick actions ── */
  .adm-qa { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-qa-card {
    padding: 14px 14px 13px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.07);
    cursor: pointer; text-align: left;
    transition: all 0.2s; position: relative; overflow: hidden;
    display: flex; flex-direction: column; gap: 6px;
  }
  .adm-qa-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.14);
  }
  .adm-qa-card:active { transform: scale(0.97); }
  .adm-qa-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at top left, var(--qa-glow), transparent 70%);
    opacity: 0; transition: opacity 0.2s;
  }
  .adm-qa-card:hover::before { opacity: 1; }
  .adm-qa-icon {
    font-size: 20px;
    line-height: 1;
    margin-bottom: 2px;
  }
  .adm-qa-label {
    font-family: ${FD};
    font-size: 14px; font-weight: 600;
    color: #f0ece3; letter-spacing: 0.01em;
    line-height: 1.1;
  }
  .adm-qa-sub {
    font-family: ${FM};
    font-size: 9px; color: rgba(240,236,227,0.3);
    letter-spacing: 0.06em; line-height: 1.4;
  }
  .adm-qa-arrow {
    position: absolute; right: 12px; top: 12px;
    font-size: 11px; opacity: 0.2;
    transition: opacity 0.2s, transform 0.2s;
  }
  .adm-qa-card:hover .adm-qa-arrow { opacity: 0.7; transform: translate(2px,-2px); }

  /* ── Users panel ── */
  .adm-panel {
    border-radius: 18px;
    background: rgba(255,255,255,0.042);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(201,168,76,0.22);
    box-shadow: 0 0 0 1px rgba(201,168,76,0.05) inset, 0 20px 60px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .adm-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .adm-panel-title {
    font-family: ${FD};
    font-size: 18px; font-weight: 600;
    color: #f0ece3; letter-spacing: 0.01em;
  }
  .adm-panel-count {
    font-family: ${FM};
    font-size: 9px; color: rgba(240,236,227,0.25);
    letter-spacing: 0.12em; margin-top: 1px;
  }

  /* ── Search bar ── */
  .adm-search-wrap {
    padding: 12px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative;
  }
  .adm-search-icon {
    position: absolute; left: 30px; top: 50%;
    transform: translateY(-50%);
    font-size: 12px; color: rgba(240,236,227,0.2);
    pointer-events: none;
  }
  .adm-search {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    color: #f0ece3;
    font-family: ${FM};
    font-size: 11.5px; letter-spacing: 0.04em;
    padding: 9px 14px 9px 34px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .adm-search::placeholder { color: rgba(240,236,227,0.18); }
  .adm-search:focus {
    border-color: rgba(201,168,76,0.4);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.06);
  }

  /* ── Add user button ── */
  .adm-btn-add {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 15px;
    border-radius: 10px;
    background: rgba(201,168,76,0.13);
    border: 1px solid rgba(201,168,76,0.28);
    color: #c9a84c;
    font-family: ${FM};
    font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .adm-btn-add:hover {
    background: rgba(201,168,76,0.22);
    box-shadow: 0 0 16px rgba(201,168,76,0.18);
  }

  /* ── Add user form ── */
  .adm-form {
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(201,168,76,0.03);
    display: flex; flex-direction: column; gap: 11px;
    animation: adm-drop 0.22s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes adm-drop {
    from { opacity:0; transform: translateY(-8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .adm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 11px;
    color: #f0ece3;
    font-family: ${FM};
    font-size: 11.5px; letter-spacing: 0.03em;
    padding: 11px 13px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .adm-input::placeholder { color: rgba(240,236,227,0.2); }
  .adm-input:focus {
    border-color: rgba(201,168,76,0.45);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.07);
  }
  .adm-input option { background: #0e0e1a; }
  .adm-btn-submit {
    width: 100%; padding: 12px;
    border-radius: 11px;
    background: linear-gradient(135deg, rgba(201,168,76,0.9), rgba(175,135,45,0.9));
    color: #080810;
    font-family: ${FM};
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    border: none; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 0 24px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .adm-btn-submit:hover:not(:disabled) {
    opacity: 0.88;
    box-shadow: 0 0 36px rgba(201,168,76,0.36), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .adm-btn-submit:active:not(:disabled) { transform: scale(0.985); }
  .adm-btn-submit:disabled { opacity: 0.32; cursor: not-allowed; }
  .adm-err {
    font-family: ${FM};
    font-size: 10px; color: #e05c5c; letter-spacing: 0.06em;
  }

  /* ── User row ── */
  .adm-user-row {
    display: flex; align-items: center; gap: 11px;
    padding: 13px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s;
  }
  .adm-user-row:last-child { border-bottom: none; }
  .adm-user-row:hover { background: rgba(255,255,255,0.02); }
  .adm-user-ava {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.04));
    border: 1px solid rgba(201,168,76,0.14);
    display: flex; align-items: center; justify-content: center;
    font-family: ${FD};
    font-size: 12px; font-weight: 600; color: #c9a84c;
    flex-shrink: 0;
  }
  .adm-user-name {
    font-family: ${FD};
    font-size: 13.5px; font-weight: 600;
    color: #f0ece3; letter-spacing: 0.01em;
  }
  .adm-user-email {
    font-family: ${FM};
    font-size: 9.5px; color: rgba(240,236,227,0.25);
    letter-spacing: 0.04em; margin-top: 1px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .adm-user-date {
    font-family: ${FM};
    font-size: 8px; color: rgba(240,236,227,0.15);
    letter-spacing: 0.08em; margin-top: 2px;
  }
  .adm-role-badge {
    display: inline-flex; align-items: center;
    padding: 4px 9px; border-radius: 99px;
    font-family: ${FM};
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid; white-space: nowrap; flex-shrink: 0;
  }

  /* ── Empty / loading ── */
  .adm-empty {
    padding: 40px 18px; text-align: center;
    font-family: ${FM};
    font-size: 10.5px; color: rgba(240,236,227,0.18);
    letter-spacing: 0.12em;
  }
  .adm-loading {
    padding: 40px; display:flex;
    align-items:center; justify-content:center;
  }
  .adm-ring {
    width: 26px; height: 26px;
    border: 2px solid rgba(201,168,76,0.18);
    border-top-color: rgba(201,168,76,0.7);
    border-radius: 50%;
    animation: adm-spin 0.8s linear infinite;
  }
  @keyframes adm-spin { to { transform:rotate(360deg); } }
  .adm-spin-sm {
    display: inline-block; width: 11px; height: 11px;
    border: 2px solid rgba(8,8,16,0.3);
    border-top-color: rgba(8,8,16,0.8);
    border-radius: 50%;
    animation: adm-spin 0.7s linear infinite;
  }

  /* ── Panel footer ── */
  .adm-foot {
    padding: 10px 18px;
    border-top: 1px solid rgba(255,255,255,0.04);
    font-family: ${FM};
    font-size: 8.5px; letter-spacing: 0.16em;
    color: rgba(240,236,227,0.16); text-transform: uppercase;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* ── Toast ── */
  .adm-toast {
    position: fixed; top: 72px; right: 16px; z-index: 100;
    display: flex; align-items: center; gap: 9px;
    padding: 12px 16px;
    border-radius: 13px;
    background: rgba(10,10,20,0.97);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    font-family: ${FM};
    font-size: 11px; color: #f0ece3; letter-spacing: 0.04em;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    min-width: 220px;
    animation: adm-toast-in 0.3s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes adm-toast-in {
    from { opacity:0; transform: translateX(16px) scale(0.95); }
    to   { opacity:1; transform: translateX(0)    scale(1); }
  }
  .adm-toast-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .adm-toast.ok  .adm-toast-dot { background:#4ec994; box-shadow:0 0 8px #4ec994; }
  .adm-toast.err .adm-toast-dot { background:#e05c5c; box-shadow:0 0 8px #e05c5c; }
  .adm-toast.ok  { border-color:rgba(78,201,148,0.2); }
  .adm-toast.err { border-color:rgba(224,92,92,0.2); }

  /* ── Activity feed ── */
  .adm-feed { display:flex; flex-direction:column; gap:0; }
  .adm-feed-row {
    display:flex; align-items:flex-start; gap:12px;
    padding: 12px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .adm-feed-row:last-child { border-bottom:none; }
  .adm-feed-dot {
    width:8px; height:8px; border-radius:50%;
    margin-top:3px; flex-shrink:0;
  }
  .adm-feed-msg {
    font-family: ${FM};
    font-size: 10.5px; color: rgba(240,236,227,0.6);
    letter-spacing: 0.03em; line-height:1.5;
  }
  .adm-feed-time {
    font-size: 9px; color: rgba(240,236,227,0.2);
    letter-spacing: 0.08em; margin-top:2px;
  }
`;

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg:string; type:'ok'|'err'; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return ()=>clearTimeout(t); }, []);
  return (
    <div className={`adm-toast ${type}`}>
      <span className="adm-toast-dot" />
      {msg}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { session, appUser } = useAuth();
  const navigate = useNavigate();
  const token = session?.access_token ?? '';

  const [users, setUsers]               = useState<AppUser[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState({ email:'', fullName:'', role:'TEACHER' as UserRole });
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState<{msg:string;type:'ok'|'err'}|null>(null);
  const nextId = useRef(1000);

  // Inject styles
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'adm-styles';
    el.textContent = STYLES;
    if (!document.getElementById('adm-styles')) document.head.appendChild(el);
    return () => { document.getElementById('adm-styles')?.remove(); };
  }, []);

  // Fetch data
  useEffect(() => {
    Promise.all([
      tenantApi.listUsers(token),
      studentsApi.list(token),
    ]).then(([u, s]: any) => {
      setUsers(u);
      setStudentCount(Array.isArray(s) ? s.length : 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const newUser: any = await tenantApi.createUser(token, form);
      setUsers(u => [newUser, ...u]);
      setShowForm(false);
      setForm({ email:'', fullName:'', role:'TEACHER' });
      setToast({ msg: `${form.fullName} added successfully.`, type:'ok' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const handleQA = (path: string) => {
    if (path === '#add-user') { setShowForm(true); return; }
    navigate(path);
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]?.toUpperCase() ?? '').join('').slice(0,2) || '??';

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label:'Total Users', value: users.length,                                   accent:'#c9a84c', icon:'👥', sub:'All registered accounts' },
    { label:'Students',    value: studentCount,                                    accent:'#4ec994', icon:'🎓', sub:'Enrolled this term' },
    { label:'Staff',       value: users.filter(u=>u.role!=='STUDENT').length,      accent:'#7ec8f5', icon:'👔', sub:'Active staff members' },
    { label:'Tenant',      value: null, tenant: appUser?.tenant?.subdomain ?? '—', accent:'#f59e0b', icon:'🏫', sub:'System identifier' },
  ];

  // Mock activity feed
  const feed = [
    { msg:'Samuel Alemu logged in',                  time:'Just now',   color:'#4ec994' },
    { msg:'New student record created',              time:'2 min ago',  color:'#c9a84c' },
    { msg:'Meal log submitted by Meal Recorder',     time:'18 min ago', color:'#7ec8f5' },
    { msg:'System backup completed',                 time:'1 hr ago',   color:'#a78bfa' },
    { msg:'Schedule updated for Grade 11',           time:'3 hrs ago',  color:'#f59e0b' },
  ];

  return (
    <DashboardShell title="Admin Panel">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="adm">

        {/* ── Stats ── */}
        <div>
          <div className="adm-sec">Overview</div>
          <div className="adm-stats">
            {stats.map(s => (
              <div key={s.label} className="adm-stat">
                <div className="adm-stat-accent" style={{ background: s.accent }} />
                <div className="adm-stat-top">
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-icon">{s.icon}</div>
                </div>
                {s.tenant !== undefined
                  ? <div className="adm-stat-tenant">{loading ? '—' : s.tenant}</div>
                  : <div className="adm-stat-val">{loading ? '—' : s.value}</div>
                }
                <div className="adm-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div>
          <div className="adm-sec">Quick Actions</div>
          <div className="adm-qa">
          
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.label}
                className="adm-qa-card"
style={{ '--qa-glow': qa.glow } as React.CSSProperties}
                onClick={() => handleQA(qa.path)}
              >
                <span className="adm-qa-arrow">↗</span>
                <div className="adm-qa-icon" style={{ color: qa.color }}>{qa.icon}</div>
                <div className="adm-qa-label">{qa.label}</div>
                <div className="adm-qa-sub">{qa.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Users panel ── */}
        <div>
          <div className="adm-sec">User Management</div>
          <div className="adm-panel">
            <div className="adm-panel-head">
              <div>
                <div className="adm-panel-title">Users</div>
                <div className="adm-panel-count">{users.length} total · {users.filter(u=>u.role==='STUDENT').length} students · {users.filter(u=>u.role!=='STUDENT').length} staff</div>
              </div>
              <button className="adm-btn-add" onClick={() => { setShowForm(o=>!o); setError(''); }}>
                {showForm ? '✕ Cancel' : '+ Add User'}
              </button>
            </div>

            {/* Add user form */}
            {showForm && (
              <form onSubmit={handleCreateUser} className="adm-form">
                {error && <p className="adm-err">⚠ {error}</p>}
                <input className="adm-input" placeholder="Full name"
                  value={form.fullName} onChange={e => setForm(f=>({...f,fullName:e.target.value}))} required />
                <input type="email" className="adm-input" placeholder="Email address"
                  value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
                <div className="adm-form-grid">
                  <select className="adm-input" value={form.role}
                    onChange={e => setForm(f=>({...f,role:e.target.value as UserRole}))}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                  </select>
                  <button type="submit" className="adm-btn-submit" disabled={saving}>
                    {saving && <span className="adm-spin-sm" />}
                    {saving ? 'Creating…' : 'Create →'}
                  </button>
                </div>
              </form>
            )}

            {/* Search */}
            <div className="adm-search-wrap">
              <span className="adm-search-icon">🔍</span>
              <input className="adm-search" placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* List */}
            {loading ? (
              <div className="adm-loading"><div className="adm-ring" /></div>
            ) : filtered.length === 0 ? (
              <div className="adm-empty">
                {search ? 'No users match your search.' : 'No users yet.'}
              </div>
            ) : (
              <ul style={{ listStyle:'none', margin:0, padding:0 }}>
                {filtered.map(u => {
                  const rs = ROLE_STYLE[u.role];
                  return (
                    <li key={u.id} className="adm-user-row">
                      <div className="adm-user-ava">{initials(u.fullName)}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="adm-user-name">{u.fullName}</div>
                        <div className="adm-user-email">{u.email}</div>
                        <div className="adm-user-date">
                          {u.createdAt ? `Joined ${new Date(u.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : ''}
                        </div>
                      </div>
                      <span className="adm-role-badge"
                        style={{ background:rs.bg, color:rs.color, borderColor:rs.border }}>
                        {u.role.replace(/_/g,' ')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="adm-foot">
              <span>{filtered.length} of {users.length} users</span>
              <span>{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div>
          <div className="adm-sec">Recent Activity</div>
          <div className="adm-panel">
            <div className="adm-feed">
              {feed.map((f, i) => (
                <div key={i} className="adm-feed-row">
                  <div className="adm-feed-dot" style={{ background: f.color, boxShadow:`0 0 6px ${f.color}` }} />
                  <div>
                    <div className="adm-feed-msg">{f.msg}</div>
                    <div className="adm-feed-time">{f.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
                }
