'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getMobileSession,
  saveMobileSession,
  clearMobileSession,
} from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getMobileSession();
      if (saved?.sessionToken) setSession(saved);
      setLoading(false);
    })();
  }, []);

  async function signIn(sessionData) {
    await saveMobileSession(sessionData);
    setSession(sessionData);
  }

  async function signOut() {
    await clearMobileSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}