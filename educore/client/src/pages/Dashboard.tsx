// This file is kept for backwards compatibility only.
// All dashboard routing is now handled by RoleRouter.
// File: educore/client/src/pages/Dashboard.tsx

import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  return <Navigate to="/dashboard" replace />;
}
