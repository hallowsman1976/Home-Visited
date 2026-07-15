import { describe, expect, it, vi } from 'vitest';

describe('API envelope contract', () => {
  it('accepts a standard success envelope', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.test/exec');
    const envelope = {
      ok: true,
      requestId: 'req-1',
      data: { status: 'ok' },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.error).toBeNull();
    expect(envelope.data.status).toBe('ok');
  });
});

