// ============================================================
// EduCore: Teacher Dashboard
// File: educore/client/src/pages/dashboard/TeacherDashboard.tsx
// ============================================================

import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { useAuth } from '../../context/AuthContext';

interface Mark { studentId: string; name: string; score: string; }
interface SyllabusItem { id: string; topic: string; done: boolean; }

const MOCK_STUDENTS: Mark[] = [
  { studentId: '1000', name: 'Amara Osei', score: '' },
  { studentId: '1001', name: 'Kofi Mensah', score: '' },
  { studentId: '1002', name: 'Ama Boateng', score: '' },
  { studentId: '1003', name: 'Kwame Asante', score: '' },
];

const MOCK_SYLLABUS: SyllabusItem[] = [
  { id: '1', topic: 'Introduction to Algebra', done: true },
  { id: '2', topic: 'Linear Equations', done: true },
  { id: '3', topic: 'Quadratic Functions', done: false },
  { id: '4', topic: 'Trigonometry Basics', done: false },
  { id: '5', topic: 'Statistics & Probability', done: false },
];

export default function TeacherDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'marks' | 'syllabus'>('marks');
  const [marks, setMarks] = useState<Mark[]>(MOCK_STUDENTS);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(MOCK_SYLLABUS);
  const [saved, setSaved] = useState(false);

  function updateMark(studentId: string, score: string) {
    setMarks(m => m.map(s => s.studentId === studentId ? { ...s, score } : s));
  }

  function toggleTopic(id: string) {
    setSyllabus(s => s.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function handleSaveMarks() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const doneCount = syllabus.filter(s => s.done).length;
  const progress = Math.round((doneCount / syllabus.length) * 100);

  return (
    <DashboardShell title="Teacher Panel">
      <div className="space-y-4">

        {/* Welcome */}
        <div className="bg-indigo-950 text-white rounded-xl p-4">
          <p className="text-indigo-300 text-xs tracking-widest uppercase">Welcome back</p>
          <p className="text-lg font-semibold mt-0.5">{appUser?.fullName}</p>
          <p className="text-indigo-300 text-xs mt-1">Current period · Mathematics · Form 2A</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['marks', 'syllabus'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98] capitalize
                ${activeTab === tab ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-500'}`}
            >
              {tab === 'marks' ? '✎ Marks' : '☰ Syllabus'}
            </button>
          ))}
        </div>

        {/* Marks tab */}
        {activeTab === 'marks' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-indigo-950">Quick Mark Entry</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mathematics · Quiz 3</p>
            </div>
            <ul className="divide-y divide-slate-50">
              {marks.map(s => (
                <li key={s.studentId} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-sm font-medium text-indigo-950">{s.name}</p>
                    <p className="text-xs text-slate-400">ID: {s.studentId}</p>
                  </div>
                  <input
                    type="number"
                    min="0" max="100"
                    placeholder="—"
                    value={s.score}
                    onChange={e => updateMark(s.studentId, e.target.value)}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={handleSaveMarks}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98]
                  ${saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}
              >
                {saved ? '✓ Saved!' : 'Save Marks'}
              </button>
            </div>
          </div>
        )}

        {/* Syllabus tab */}
        {activeTab === 'syllabus' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-indigo-950">Syllabus Tracker</h2>
                <span className="text-xs text-indigo-600 font-medium">{doneCount}/{syllabus.length} done</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-slate-50">
              {syllabus.map(item => (
                <li
                  key={item.id}
                  onClick={() => toggleTopic(item.id)}
                  className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                    {item.done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className={`text-sm ${item.done ? 'line-through text-slate-400' : 'text-indigo-950'}`}>
                    {item.topic}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
