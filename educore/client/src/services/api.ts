// ============================================================
// EduCore: API Service Layer
// File: src/services/api.ts
// ============================================================

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Students ──────────────────────────────────────────────

export const studentsApi = {
  list: (token: string) =>
    apiFetch('/api/students', token),

  create: (token: string, fullName: string) =>
    apiFetch('/api/students', token, {
      method: 'POST',
      body: JSON.stringify({ fullName }),
    }),

  getQR: (token: string, studentId: number) =>
    apiFetch(`/api/students/${studentId}/qr`, token),
};

// ── Tenant / Users ────────────────────────────────────────

export const tenantApi = {
  me: (token: string) =>
    apiFetch('/api/tenant/me', token),

  listUsers: (token: string) =>
    apiFetch('/api/tenant/users', token),

  createUser: (
    token: string,
    data: { email: string; fullName: string; role: string }
  ) =>
    apiFetch('/api/tenant/users', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUserRole: (token: string, userId: string, role: string) =>
    apiFetch(`/api/tenant/users/${userId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  getUserProfile: (token: string, id: string) =>
    apiFetch(`/api/tenant/users/${encodeURIComponent(id)}`, token),

  linkAccount: (token: string, email: string) =>
    apiFetch('/api/tenant/auth/link', token, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
