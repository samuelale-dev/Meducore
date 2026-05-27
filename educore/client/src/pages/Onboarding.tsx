// ============================================================
// EduCore: Onboarding Page
// File: educore/client/src/pages/Onboarding.tsx
// Shown to users who have logged in but have no provisioned account yet
// ============================================================

import { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

const ROLES: { value: UserRole; label: string; icon: string; description: string }[] = [
  { value: 'ADMIN',             label: 'Administrator',       icon: '▦', description: 'Manage the school system' },
  { value: 'TEACHER',           label: 'Teacher',             icon: '✎', description: 'Teach classes & enter marks' },
  { value: 'HOMEROOM_TEACHER',  label: 'Homeroom Teacher',    icon: '◉', description: 'Manage student roster' },
  { value: 'STUDENT',           label: 'Student',             icon: '◈', description: 'View profile & QR code' },
  { value: 'LIBRARY_ASSISTANT', label: 'Library Assistant',   icon: '☰', description: 'Manage book check-ins' },
  { value: 'MEAL_RECORDER',     label: 'Meal Recorder',       icon: '◑', description: 'Log student meals' },
];

type Step = 'role' | 'verify' | 'success';

export default function Onboarding() {
  const { supabaseUser, signOut } = useAuth();
  const [step, setStep]           = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [verifyId, setVerifyId]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !verifyId.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Get the current session token
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Try to link account using the provided ID as verification
      const res = await fetch('/api/onboarding/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          verificationId: verifyId.trim(),
          email: supabaseUser?.email,
          authId: supabaseUser?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Verification failed. Check your ID and try again.');
        return;
      }

      setStep('success');
      // Reload after short delay so AuthContext re-fetches the new user record
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center px-4 py-8">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">E</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to EduCore</h1>
        <p className="text-indigo-300 text-sm mt-1">{supabaseUser?.email}</p>
      </div>

      <div className="w-full max-w-md">

        {/* Step: Role Selection */}
        {step === 'role' && (
          <div className="space-y-3">
            <p className="text-indigo-200 text-sm text-center mb-5">
              What is your role at this school?
            </p>
            {ROLES.map(role => (
              <button
                key={role.value}
                onClick={() => { setSelectedRole(role.value); setStep('verify'); }}
                className={`w-full flex items-center gap-4 bg-indigo-900 border-2 rounded-xl px-4 py-3.5
                  active:scale-[0.98] transition-all
                  ${selectedRole === role.value
                    ? 'border-indigo-400'
                    : 'border-indigo-800 hover:border-indigo-600'
                  }`}
              >
                <span className="text-2xl w-8 text-center text-indigo-300">{role.icon}</span>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{role.label}</p>
                  <p className="text-indigo-400 text-xs">{role.description}</p>
                </div>
                <span className="ml-auto text-indigo-400">›</span>
              </button>
            ))}

            <button
              onClick={signOut}
              className="w-full text-indigo-400 text-sm py-3 text-center"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Step: ID Verification */}
        {step === 'verify' && selectedRole && (
          <div className="bg-indigo-900 rounded-2xl p-6 space-y-4">
            <button
              onClick={() => { setStep('role'); setError(''); }}
              className="text-indigo-400 text-sm flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center py-2">
              <span className="text-4xl">
                {ROLES.find(r => r.value === selectedRole)?.icon}
              </span>
              <p className="text-white font-semibold mt-2">
                {ROLES.find(r => r.value === selectedRole)?.label}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg px-3 py-2">
                  <p className="text-rose-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-indigo-200 text-sm font-medium mb-1.5">
                  {selectedRole === 'STUDENT'
                    ? 'Your Student ID (e.g. 1000)'
                    : 'Your Staff ID or registered email'}
                </label>
                <input
                  className="w-full bg-indigo-800 border border-indigo-600 rounded-xl px-4 py-3 text-white placeholder-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder={selectedRole === 'STUDENT' ? '1000' : 'staff@school.com'}
                  value={verifyId}
                  onChange={e => setVerifyId(e.target.value)}
                  required
                />
                <p className="text-indigo-500 text-xs mt-1.5">
                  This must match your record in the school system
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl">✓</span>
            </div>
            <p className="text-white text-lg font-semibold">Account Verified!</p>
            <p className="text-indigo-300 text-sm">Redirecting to your dashboard…</p>
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
