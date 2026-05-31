import * as SecureStore from 'expo-secure-store';

import type { AdminData } from '@/lib/types';

const SESSION_KEY = 'ruet_admin_session_id';
const USER_KEY = 'ruet_admin_user';

export async function saveSessionId(sessionId: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, sessionId);
}

export async function getSessionId(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSessionId(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function saveUser(user: AdminData): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<AdminData | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminData) : null;
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearSessionId(), clearUser()]);
}

export function parseSessionIdFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/sessionId=([^;,\s]+)/);
  return match?.[1] ?? null;
}

export function extractSessionIdFromHeaders(headers: Headers): string | null {
  const setCookie = headers.get('set-cookie');
  return parseSessionIdFromSetCookie(setCookie);
}
