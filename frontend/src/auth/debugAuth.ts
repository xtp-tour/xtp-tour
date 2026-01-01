export const DEBUG_AUTH_STORAGE_KEY = 'xtp_debug_auth_token';

export const isDebugAuthEnabled =
  (import.meta.env.VITE_DEBUG_AUTH_ENABLED || '').toLowerCase() === 'true';

export function getDebugAuthToken(): string | undefined {
  if (!isDebugAuthEnabled) return undefined;
  try {
    return localStorage.getItem(DEBUG_AUTH_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function setDebugAuthToken(token: string): void {
  if (!isDebugAuthEnabled) return;
  localStorage.setItem(DEBUG_AUTH_STORAGE_KEY, token);
}

export function clearDebugAuthToken(): void {
  if (!isDebugAuthEnabled) return;
  localStorage.removeItem(DEBUG_AUTH_STORAGE_KEY);
}

