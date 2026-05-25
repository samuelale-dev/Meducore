// ============================================================
// EduCore Phase 1: Updated AuthContext
// File: educore/client/src/context/AuthContext.tsx
// Now fetches tenant + role from backend after login
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type UserRole =
  | 'ADMIN'
  | 'TEACHER'
  | 'HOMEROOM_TEACHER'
  | 'STUDENT'
  | 'LIBRARY_ASSISTANT'
  | 'MEAL_RECORDER';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

interface AuthContextValue {
  session: Session | null;
  supabaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  session: null,
  supabaseUser: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
});

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch app-level profile (tenant + role) from Railway backend
  async function fetchAppUser(accessToken: string): Promise<void> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 403) {
        // User authenticated but not provisioned yet
        // Try to auto-link if the user is pre-provisioned by email
        const linkRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tenant/auth/link`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: (await supabase.auth.getUser()).data.user?.email,
            }),
          }
        );

        if (linkRes.ok) {
          // Retry fetching profile after linking
          const retryRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/tenant/me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (retryRes.ok) {
            const data = await retryRes.json();
            setAppUser(data);
          }
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAppUser(data);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to fetch app user:', err);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.access_token) {
        fetchAppUser(session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.access_token) {
          setLoading(true);
          fetchAppUser(session.access_token).finally(() => setLoading(false));
        } else {
          setAppUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setAppUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, supabaseUser, appUser, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

// ─────────────────────────────────────────────
// Role guard hook
// Usage: const isAdmin = useHasRole('ADMIN');
// ─────────────────────────────────────────────

export function useHasRole(...roles: UserRole[]): boolean {
  const { appUser } = useAuth();
  if (!appUser) return false;
  return roles.includes(appUser.role);
}
