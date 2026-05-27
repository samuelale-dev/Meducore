import {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole =
  | 'ADMIN' | 'TEACHER' | 'HOMEROOM_TEACHER'
  | 'STUDENT' | 'LIBRARY_ASSISTANT' | 'MEAL_RECORDER';

export interface AppUser {
  id: string; email: string; fullName: string; role: UserRole;
  tenant: { id: string; name: string; subdomain: string; };
}

interface AuthContextValue {
  session: Session | null;
  supabaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null, supabaseUser: null, appUser: null, loading: true,
  signOut: async () => {}, signInWithGoogle: async () => {}, signInWithEmail: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]           = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [appUser, setAppUser]           = useState<AppUser | null>(null);
  const [loading, setLoading]           = useState(true);

  async function fetchAppUser(accessToken: string, email?: string): Promise<void> {
    try {
      const res = await fetch('/api/tenant/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 403 && email) {
        const linkRes = await fetch('/api/tenant/auth/link', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
      console.error('[AuthContext] fetchAppUser error:', err);
    }
  }

  useEffect(() => {
    // IMPORTANT: detectSessionInUrl handles the #access_token hash from OAuth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.access_token) {
        fetchAppUser(session.access_token, session.user.email)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);

        if (session?.access_token) {
          setLoading(true);
          await fetchAppUser(session.access_token, session.user?.email);
          setLoading(false);

          // After OAuth callback, redirect away from /dashboard hash URL to clean URL
          if (event === 'SIGNED_IN') {
            const url = new URL(window.location.href);
            if (url.hash.includes('access_token')) {
              // Clean the hash and navigate to dashboard
              window.history.replaceState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }
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
    window.location.href = '/login';
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.href = '/dashboard';
  }

  return (
    <AuthContext.Provider value={{
      session, supabaseUser, appUser, loading,
      signOut, signInWithGoogle, signInWithEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

export function useHasRole(...roles: UserRole[]): boolean {
  const { appUser } = useAuth();
  if (!appUser) return false;
  return roles.includes(appUser.role);
                                    }
