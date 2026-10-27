import { config } from './config';
import { auth } from './firebase';

type ApiOptions = Omit<RequestInit, 'body'> & { token?: string; body?: unknown };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, body, method, ...requestOptions } = options;
  
  let authToken = token;
  if (!authToken && auth.currentUser) {
    try {
      authToken = await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn('Could not retrieve Firebase auth token', e);
    }
  }

  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...requestOptions,
    method: method || (body ? 'POST' : 'GET'),
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { error?: string; detail?: string; message?: string };
      throw new Error(parsed.error ?? parsed.detail ?? parsed.message ?? `Request failed (${response.status})`);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(detail || `Request failed (${response.status})`);
      throw error;
    }
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined as T;
  return response.json() as Promise<T>;
}
