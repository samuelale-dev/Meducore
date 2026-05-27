// ============================================================
// EduCore: App.tsx — Full Route Tree
// File: educore/client/src/App.tsx
// Replace your existing App.tsx with this
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { flushQueue } from './lib/syncQueue';

// Pages
import Login          from './pages/Login';
import RoleRouter     from './pages/RoleRouter';
import AdminDashboard    from './pages/dashboard/AdminDashboard';
import TeacherDashboard  from './pages/dashboard/TeacherDashboard';
import HomeroomDashboard from './pages/dashboard/HomeroomDashboard';
import StudentDashboard  from './pages/dashboard/StudentDashboard';
import LibraryDashboard  from './pages/dashboard/LibraryDashboard';
import MealsDashboard    from './pages/dashboard/MealsDashboard';

// Flush offline queue when back online
function OfflineSyncManager() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;
    const flush = () => flushQueue(session.access_token);

    window.addEventListener('online', flush);
    // Also flush on mount in case we just came back online
    if (navigator.onLine) flush();

    return () => window.removeEventListener('online', flush);
  }, [session]);

  return null;
}

// Redirect unauthenticated users to login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineSyncManager />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Role router — sends user to their dashboard */}
          <Route path="/" element={
            <ProtectedRoute><RoleRouter /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><RoleRouter /></ProtectedRoute>
          } />

          {/* Role dashboards */}
          <Route path="/dashboard/admin/*" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/teacher/*" element={
            <ProtectedRoute><TeacherDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/homeroom/*" element={
            <ProtectedRoute><HomeroomDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/student/*" element={
            <ProtectedRoute><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/library/*" element={
            <ProtectedRoute><LibraryDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/meals/*" element={
            <ProtectedRoute><MealsDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
            }
