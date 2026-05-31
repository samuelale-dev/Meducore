// ============================================================
// EduCore: Admin Dashboard
// File: educore/client/src/pages/dashboard/AdminDashboard.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import { tenantApi, studentsApi } from '../../services/api';

type UserRole = 'ADMIN' | 'TEACHER' | 'HOMEROOM_TEACHER' | 'STUDENT' | 'LIBRARY_ASSISTANT' | 'MEAL_RECORDER';

interface AppUser {
  id: string; email: string; fullName: string; role: UserRole; createdAt: string;
}

// High-end, sophisticated translucent badges for dark mode
const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:             'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
  TEACHER:           'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  HOMEROOM_TEACHER:  'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  STUDENT:           'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  LIBRARY_ASSISTANT: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  MEAL_RECORDER:     'bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20',
};

export default function AdminDashboard() {
  const { session, appUser } = useAuth();
  const token = session?.access_token ?? '';

  const [users, setUsers]         = useState<AppUser[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ email: '', fullName: '', role: 'TEACHER' as UserRole });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

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
    { label: 'Total Users',    value: users.length,   glow: 'group-hover:border-indigo-500/40' },
    { label: 'Students',       value: studentCount,   glow: 'group-hover:border-emerald-500/40' },
    { label: 'Staff',          value: users.filter(u => u.role !== 'STUDENT').length, glow: 'group-hover:border-violet-500/40' },
    { label: 'Tenant Environment', value: appUser?.tenant.subdomain ?? '—', glow: 'group-hover:border-amber-500/40', small: true },
  ];

  return (
    <DashboardShell title="Admin Panel">
      <div className="space-y-6 max-w-7xl mx-auto p-1 text-[#f4f4f5]">

        {/* Header/Subtitle Context */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">System Architecture</h1>
          <p className="text-sm text-zinc-400">Manage institutional directory roles, configurations, and tenant entities.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div 
              key={s.label} 
              className={`bg-[#18181b] rounded-xl p-5 border border-zinc-800 transition-all duration-300 group hover:bg-[#1c1c21] hover:border-zinc-700 ${s.glow}`}
            >
              <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">{s.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-7 w-12 bg-zinc-800 animate-pulse rounded-md" />
                ) : (
                  <p className={`font-bold tracking-tight text-white transition-colors group-hover:text-white ${s.small ? 'text-lg text-zinc-300' : 'text-3xl'}`}>
                    {s.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Users Core Block */}
        <div className="bg-[#18181b] rounded-xl border border-zinc-800 overflow-hidden shadow-xl shadow-black/20">
          
          {/* Section Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#1c1c21]/50">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Identity Directory</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Authorized user accounts assigned to this subdomain.</p>
            </div>
            <button
              onClick={() => setShowForm(o => !o)}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-all active:scale-[0.98] ${
                showForm 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                  : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/5'
              }`}
            >
              {showForm ? 'Cancel' : 'Add Account'}
            </button>
          </div>

          {/* Add User Modular Drawer/Form */}
          {showForm && (
            <div className="bg-[#141417] border-b border-zinc-800 px-6 py-5">
              <form onSubmit={handleCreateUser} className="max-w-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">New Identity Configuration</h3>
                  {error && <span className="text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-0.5 rounded-md">{error}</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                    placeholder="Full identity name"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    required
                  />
                  <input
                    type="email"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                    placeholder="Authentication email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <select
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 appearance-none cursor-pointer"
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    >
                      {(['ADMIN','TEACHER','HOMEROOM_TEACHER','STUDENT','LIBRARY_ASSISTANT','MEAL_RECORDER'] as UserRole[]).map(r => (
                        <option key={r} value={r} className="bg-[#18181b]">{r.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40 whitespace-nowrap shadow-lg shadow-indigo-600/10"
                  >
                    {saving ? 'Provisioning…' : 'Provision User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User Tabular Data Stack */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              <div className="text-zinc-500 text-xs font-medium tracking-wide">Syncing system directory...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm font-medium">
              No registered user modules discovered inside this tenant scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-zinc-800 bg-[#1c1c21]/20 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th class="py-3 px-6">System Identity</th>
                    <th class="py-3 px-6 text-right">Access Role Mapping</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/40 text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#1c1c21]/20 transition-colors group">
                      <td class="py-3.5 px-6">
                        <div class="flex items-center gap-3">
                          {/* Generates a stylized visual dark gradient avatar placeholder */}
                          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-zinc-700 font-bold text-xs text-zinc-300 uppercase select-none">
                            {u.fullName.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{u.fullName}</p>
                            <p className="text-xs text-zinc-500 font-normal">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-6 text-right vertical-middle">
                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-md font-semibold tracking-wide uppercase ${ROLE_COLORS[u.role]}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

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
