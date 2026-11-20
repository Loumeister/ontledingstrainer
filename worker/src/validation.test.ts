import { afterEach, expect, it, vi } from 'vitest';
import { jsonBody } from './validation';

afterEach(() => vi.useRealTimers());
it('times out and cancels a stalled inbound body without retaining the stream', async () => {
  vi.useFakeTimers();
  const cancel = vi.fn();
  const request = new Request('https://school.example/api/reports', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel }),
    duplex: 'half',
  } as RequestInit);
  const assertion = expect(jsonBody(request)).rejects.toMatchObject({ status: 408, message: 'Verzoek verlopen.' });
  await vi.advanceTimersByTimeAsync(10000);
  await assertion;
  expect(cancel).toHaveBeenCalledOnce();
});
