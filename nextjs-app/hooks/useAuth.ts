'use client';

import { useCallback, useEffect, useState } from 'react';
import { ensureAuthenticated, getToken, isAuthenticated, setToken, clearToken } from '@/lib/auth';

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  const login = useCallback((nextToken: string) => {
    setToken(nextToken);
    setTokenState(nextToken);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  const requireAuth = useCallback(() => ensureAuthenticated(), []);

  return {
    token,
    authenticated: isAuthenticated(),
    login,
    logout,
    requireAuth,
  };
}
