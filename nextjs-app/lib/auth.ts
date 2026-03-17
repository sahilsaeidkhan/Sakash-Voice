export const AUTH_TOKEN_KEY = 'sakash_auth_token';

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getToken(): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign('/login');
}

export function ensureAuthenticated(): boolean {
  if (isAuthenticated()) {
    return true;
  }

  redirectToLogin();
  return false;
}
