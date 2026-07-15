import type { ApiEnvelope, HealthData } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

export class ApiClientError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiClientError('CONFIG_MISSING', 'ยังไม่ได้กำหนด VITE_API_BASE_URL');
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!response.ok) throw new ApiClientError('NETWORK_ERROR', `API ตอบกลับ ${response.status}`);
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.ok || !envelope.data) {
    throw new ApiClientError(envelope.error?.code || 'API_ERROR', envelope.error?.message || 'เกิดข้อผิดพลาด');
  }
  return envelope.data;
}

export async function apiPost<T>(action: string, payload: unknown = {}, sessionToken?: string): Promise<T> {
  if (!API_BASE_URL) throw new ApiClientError('CONFIG_MISSING', 'ยังไม่ได้กำหนด VITE_API_BASE_URL');
  const response = await fetch(API_BASE_URL, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, requestId: crypto.randomUUID(), sessionToken: sessionToken || '', payload }),
  });
  if (!response.ok) throw new ApiClientError('NETWORK_ERROR', `API ตอบกลับ ${response.status}`);
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.ok || !envelope.data) throw new ApiClientError(envelope.error?.code || 'API_ERROR', envelope.error?.message || 'เกิดข้อผิดพลาด');
  return envelope.data;
}

export const healthCheck = () => apiGet<HealthData>('health');
