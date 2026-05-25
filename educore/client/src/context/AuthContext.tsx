// ============================================================
// EduCore: Updated AuthContext (no more VITE_API_URL)
// File: educore/client/src/context/AuthContext.tsx
// All API calls now go to /api/* on the same Vercel domain
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

const AuthContext = createContext<AuthContextValue>({
  session: null,
  supabaseUser: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAppUser(accessToken: string, email?: string): Promise<void> {
    try {
      // Try fetching profile — all calls go to /api/* (same domain, no env var needed)
      const res = await fetch('/api/tenant/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 403 && email) {
        // Not provisioned yet — try auto-linking
        const linkRes = await fetch('/api/tenant/auth/link', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (linkRes.ok) {
          const retryRes = await fetch('/api/tenant/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (retryRes.ok) setAppUser(await retryRes.json());
        }
        return;
      }

      if (res.ok) setAppUser(await res.json());
    } catch (err) {
      console.error('[AuthContext] Failed to fetch app user:', err);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.access_token) {
        fetchAppUser(session.access_token, session.user.email).finally(() =>
          setLoading(false)
        );
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.access_token) {
          setLoading(true);
          fetchAppUser(session.access_token, session.user?.email).finally(() =>
            setLoading(false)
          );
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
    <AuthContext.Provider value={{ session, supabaseUser, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useHasRole(...roles: UserRole[]): boolean {
  const { appUser } = useAuth();
  if (!appUser) return false;
  return roles.includes(appUser.role);
                        }
