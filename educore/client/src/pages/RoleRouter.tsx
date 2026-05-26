// ============================================================
// EduCore: Role-Based Router
// File: educore/client/src/pages/RoleRouter.tsx
// Redirects authenticated users to their role dashboard
// ============================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRouter() {
  const { appUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!appUser) { navigate('/login'); return; }

    const routes: Record<string, string> = {
      ADMIN:              '/dashboard/admin',
      TEACHER:            '/dashboard/teacher',
      HOMEROOM_TEACHER:   '/dashboard/homeroom',
      STUDENT:            '/dashboard/student',
      LIBRARY_ASSISTANT:  '/dashboard/library',
      MEAL_RECORDER:      '/dashboard/meals',
    };

    navigate(routes[appUser.role] ?? '/login', { replace: true });
  }, [appUser, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-mono tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
