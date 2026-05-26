// ============================================================
// EduCore: Homeroom Teacher Dashboard
// File: educore/client/src/pages/dashboard/HomeroomDashboard.tsx
// ============================================================

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { useAuth } from '../../context/AuthContext';
import { studentsApi } from '../../services/api';

interface Student { id: number; studentId: number; fullName: string; createdAt: string; }
type BehaviourTag = 'Excellent' | 'Good' | 'Needs Attention' | 'Absent';

const TAG_STYLES: Record<BehaviourTag, string> = {
  'Excellent':       'bg-emerald-100 text-emerald-700',
  'Good':            'bg-indigo-100 text-indigo-700',
  'Needs Attention': 'bg-amber-100 text-amber-700',
  'Absent':          'bg-rose-100 text-rose-700',
};

export default function HomeroomDashboard() {
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [tags, setTags]           = useState<Record<number, BehaviourTag>>({});
  const [activeTab, setActiveTab] = useState<'roster' | 'register'>('roster');

  // New student form
  const [form, setForm]     = useState({ fullName: '' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    studentsApi.list(token)
      .then((s: any) => setStudents(s))
      .finally(() => setLoading(false));
  }, [token]);

  function setTag(studentId: number, tag: BehaviourTag) {
    setTags(t => ({ ...t, [studentId]: tag }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormErr('');
    try {
      const newStudent: any = await studentsApi.create(token, form.fullName);
      setStudents(s => [...s, newStudent]);
      setForm({ fullName: '' });
      setActiveTab('roster');
    } catch (err: any) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.studentId).includes(search)
  );

  return (
    <DashboardShell title="Homeroom">
      <div className="space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: students.length, color: 'border-indigo-600' },
            { label: 'Flagged', value: Object.values(tags).filter(t => t === 'Needs Attention').length, color: 'border-amber-500' },
            { label: 'Absent', value: Object.values(tags).filter(t => t === 'Absent').length, color: 'border-rose-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-3 border-l-4 ${s.color} shadow-sm`}>
              <p className="text-xs text-slate-400 tracking-wide uppercase">{s.label}</p>
              <p className="text-xl font-bold text-indigo-950">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['roster', 'register'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98] capitalize
                ${activeTab === tab ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-500'}`}
            >
              {tab === 'roster' ? '◉ Roster' : '+ Register'}
            </button>
          ))}
        </div>

        {/* Roster tab */}
        {activeTab === 'roster' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading roster…</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No students found</div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-indigo-950">{s.fullName}</p>
                        <p className="text-xs text-slate-400">ID: {s.studentId}</p>
                      </div>
                      <select
                        value={tags[s.studentId] ?? ''}
                        onChange={e => setTag(s.studentId, e.target.value as BehaviourTag)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer
                          ${tags[s.studentId] ? TAG_STYLES[tags[s.studentId]] : 'bg-slate-100 text-slate-500'}`}
                      >
                        <option value="">— Tag</option>
                        {(Object.keys(TAG_STYLES) as BehaviourTag[]).map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Register tab */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-indigo-950">Register New Student</h2>
            </div>
            <form onSubmit={handleRegister} className="px-4 py-4 space-y-3">
              {formErr && <p className="text-xs text-rose-500">{formErr}</p>}
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Student full name"
                value={form.fullName}
                onChange={e => setForm({ fullName: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? 'Registering…' : 'Register Student'}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
