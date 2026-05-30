import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';
import { flushQueue } from './lib/syncQueue';

import Login             from './pages/Login';
import Onboarding        from './pages/Onboarding';
import RoleRouter        from './pages/RoleRouter';
import AdminDashboard    from './pages/dashboard/AdminDashboard';
import TeacherDashboard  from './pages/dashboard/TeacherDashboard';
import HomeroomDashboard from './pages/dashboard/HomeroomDashboard';
import StudentDashboard  from './pages/dashboard/StudentDashboard';
import LibraryDashboard  from './pages/dashboard/LibraryDashboard';
import MealsDashboard    from './pages/dashboard/MealsDashboard';

function OfflineSyncManager() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session?.access_token) return;
    const flush = () => flushQueue(session.access_token);
    window.addEventListener('online', flush);
    if (navigator.onLine) flush();
    return () => window.removeEventListener('online', flush);
  }, [session]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1e1b4b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #818cf8',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!appUser) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineSyncManager />
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/"           element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />
          <Route path="/dashboard"  element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />
          <Route path="/dashboard/admin/*"    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/teacher/*"  element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/homeroom/*" element={<ProtectedRoute><HomeroomDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/student/*"  element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/library/*"  element={<ProtectedRoute><LibraryDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/meals/*"    element={<ProtectedRoute><MealsDashboard /></ProtectedRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
