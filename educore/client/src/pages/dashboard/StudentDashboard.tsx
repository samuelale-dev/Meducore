// ============================================================
// EduCore: Student Dashboard
// File: educore/client/src/pages/dashboard/StudentDashboard.tsx
// ============================================================

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { useAuth } from '../../context/AuthContext';
import { studentsApi } from '../../services/api';

interface StudentProfile {
  studentId: number;
  fullName: string;
  qrCode: string;
}

export default function StudentDashboard() {
  const { session, appUser } = useAuth();
  const token = session?.access_token ?? '';

  const [profile, setProfile]   = useState<StudentProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    // Students list their own record — matched by fullName from appUser
    studentsApi.list(token)
      .then((students: any[]) => {
        const mine = students.find(
          (s: any) => s.fullName === appUser?.fullName
        );
        if (mine) {
          // Fetch QR for this student
          return studentsApi.getQR(token, mine.studentId);
        }
        throw new Error('Student record not found');
      })
      .then((data: any) => setProfile(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, appUser]);

  return (
    <DashboardShell title="My Profile">
      <div className="space-y-4">

        {/* Profile card */}
        <div className="bg-indigo-950 text-white rounded-xl p-5">
          <p className="text-indigo-300 text-xs tracking-widest uppercase">Student</p>
          <p className="text-xl font-semibold mt-1">{appUser?.fullName}</p>
          <p className="text-indigo-300 text-sm mt-0.5">{appUser?.tenant.name}</p>
          {profile && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-900 rounded-lg px-3 py-1.5">
              <span className="text-indigo-300 text-xs">ID</span>
              <span className="text-white font-mono font-bold">{profile.studentId}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-indigo-950">Verification QR</h2>
            <p className="text-xs text-slate-400 mt-0.5">Show this to scan in at entry points</p>
          </div>

          <div className="px-4 py-6 flex flex-col items-center gap-4">
            {loading && (
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
            {error && (
              <p className="text-sm text-rose-500 text-center">{error}</p>
            )}
            {profile?.qrCode && (
              <>
                <button
                  onClick={() => setEnlarged(true)}
                  className="active:scale-[0.98] transition-transform"
                  aria-label="Tap to enlarge QR code"
                >
                  <img
                    src={profile.qrCode}
                    alt="Student QR Code"
                    className="w-48 h-48 rounded-lg border-4 border-indigo-950 shadow-md"
                  />
                </button>
                <p className="text-xs text-slate-400">Tap QR to enlarge</p>
              </>
            )}
          </div>
        </div>

        {/* Info read-only */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-indigo-950">Account Details</h2>
            <p className="text-xs text-slate-400">Read-only</p>
          </div>
          <ul className="divide-y divide-slate-50">
            {[
              { label: 'Full Name', value: appUser?.fullName },
              { label: 'Email',     value: appUser?.email },
              { label: 'Role',      value: 'Student' },
              { label: 'School',    value: appUser?.tenant.name },
            ].map(row => (
              <li key={row.label} className="flex justify-between px-4 py-3">
                <span className="text-xs text-slate-400 uppercase tracking-wide">{row.label}</span>
                <span className="text-sm text-indigo-950 font-medium">{row.value ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Enlarged QR overlay */}
      {enlarged && profile?.qrCode && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setEnlarged(false)}
        >
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3">
            <img src={profile.qrCode} alt="QR Code" className="w-72 h-72" />
            <p className="text-sm text-slate-500">ID: {profile.studentId}</p>
            <p className="text-xs text-slate-400">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
