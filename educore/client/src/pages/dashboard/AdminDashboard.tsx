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

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:             'bg-rose-100 text-rose-700',
  TEACHER:           'bg-indigo-100 text-indigo-700',
  HOMEROOM_TEACHER:  'bg-violet-100 text-violet-700',
  STUDENT:           'bg-emerald-100 text-emerald-700',
  LIBRARY_ASSISTANT: 'bg-amber-100 text-amber-700',
  MEAL_RECORDER:     'bg-sky-100 text-sky-700',
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
    { label: 'Total Users',    value: users.length,   accent: 'border-indigo-600' },
    { label: 'Students',       value: studentCount,   accent: 'border-emerald-500' },
    { label: 'Staff',          value: users.filter(u => u.role !== 'STUDENT').length, accent: 'border-violet-500' },
    { label: 'Tenant',         value: appUser?.tenant.subdomain ?? '—', accent: 'border-amber-500', small: true },
  ];

  return (
    <DashboardShell title="Admin Panel">
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
