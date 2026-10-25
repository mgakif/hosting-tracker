import { LastNotify, Project } from './types';

/**
 * Worker'daki /api uç noktaları için küçük bir istemci.
 * Oturum, HttpOnly çerez ile tutulur; tarayıcı bunu otomatik gönderir.
 */
const request = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `İstek başarısız (${res.status})`);
  }
  return data as T;
};

const send = (method: string, body?: unknown) => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  me: () => request<{ email: string }>('/me'),
  login: (email: string, password: string) =>
    request<{ email: string }>('/login', send('POST', { email, password })),
  logout: () => request('/logout', send('POST')),

  listProjects: () => request<Project[]>('/projects'),
  createProject: (data: Partial<Project>) => request('/projects', send('POST', data)),
  updateProject: (id: string, data: Partial<Project>) =>
    request(`/projects/${id}`, send('PUT', data)),
  deleteProject: (id: string) => request(`/projects/${id}`, send('DELETE')),

  getSettings: () =>
    request<{ slack_webhook_url: string; last_notify: LastNotify | null }>('/settings'),
  saveSettings: (data: { slack_webhook_url: string }) => request('/settings', send('PUT', data)),

  testSlack: (url?: string) => request('/slack/test', send('POST', { url })),
  notifySlack: () =>
    request<{ success: boolean; count: number; message?: string }>('/slack/notify', send('POST')),
};
