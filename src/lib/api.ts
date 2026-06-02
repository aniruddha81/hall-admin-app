import { API_BASE_URL } from '@/lib/config';
import {
  clearAuthStorage,
  extractSessionIdFromHeaders,
  getSessionId,
  saveSessionId,
} from '@/lib/auth-storage';
import type { ApiResponse } from '@/lib/types';

type ApiErrorBody = {
  message?: string;
  errors?: { message?: string }[];
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  formData?: FormData;
  skipAuth?: boolean;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
};

export function isRequestAborted(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return true;
  }
  return false;
}

let onUnauthorized: (() => void) | null = null;
let scopedAbortSignal: AbortSignal | undefined;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/** Runs async work with `signal` applied to nested `apiRequest` calls. */
export async function runWithAbortSignal<T>(
  signal: AbortSignal,
  fn: () => Promise<T>,
): Promise<T> {
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  const previous = scopedAbortSignal;
  scopedAbortSignal = signal;
  try {
    return await fn();
  } finally {
    scopedAbortSignal = previous;
  }
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

async function buildHeaders(options: RequestOptions, hasJsonBody: boolean): Promise<Headers> {
  const headers = new Headers(options.headers);

  if (hasJsonBody && !options.formData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const sessionId = await getSessionId();
    if (sessionId) {
      headers.set('Authorization', `Bearer ${sessionId}`);
    }
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: ApiResponse<T>; sessionId?: string }> {
  const { body, formData, skipAuth: _skipAuth, params, signal: requestSignal, ...fetchOptions } =
    options;
  const signal = requestSignal ?? scopedAbortSignal;
  const url = buildUrl(path, params);
  const hasJsonBody = body !== undefined;
  const headers = await buildHeaders(options, hasJsonBody);

  const init: RequestInit = {
    ...fetchOptions,
    headers,
    signal,
    body: formData ? formData : hasJsonBody ? JSON.stringify(body) : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isRequestAborted(error)) {
      throw error;
    }
    throw new ApiError(0, 'Network request failed. Check your connection and API URL.');
  }
  const sessionId = extractSessionIdFromHeaders(response.headers);

  const raw = await response.text();
  let payload: ApiResponse<T> | ApiErrorBody;
  try {
    if (!raw.trim()) {
      throw new Error('Empty response body');
    }
    if (raw.trimStart().startsWith('<')) {
      throw new Error('Server returned HTML instead of JSON');
    }
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      response.status,
      raw.trimStart().startsWith('<')
        ? 'Server returned an invalid response. Check API URL and endpoint.'
        : 'Invalid server response',
    );
  }

  if (!response.ok) {
    const message =
      (payload as ApiResponse<T>).message ??
      (payload as ApiErrorBody).message ??
      'Request failed';

    if (response.status === 401 && !options.skipAuth) {
      await clearAuthStorage();
      onUnauthorized?.();
    }

    throw new ApiError(response.status, message);
  }

  return { data: payload as ApiResponse<T>, sessionId: sessionId ?? undefined };
}

export function getApiErrorMessage(error: unknown): string {
  if (isRequestAborted(error)) {
    return '';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export async function persistSessionFromResponse(sessionId?: string) {
  if (sessionId) {
    await saveSessionId(sessionId);
  }
}
