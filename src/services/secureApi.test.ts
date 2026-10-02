import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStudents } from './secureApi';

afterEach(() => vi.unstubAllGlobals());
describe('private student register transport', () => {
  it('loads all authorized pages without identity or cursor in URLs', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ students: [{ id: 'one', name: 'Emma', initial: '', klas: '2b' }], nextCursor: 'one' }))
      .mockResolvedValueOnce(Response.json({ students: [{ id: 'two', name: 'Emma', initial: '', klas: '2a' }], nextCursor: null }));
    vi.stubGlobal('fetch', fetch);
    expect((await getStudents()).map(student => student.id)).toEqual(['two', 'one']);
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/teacher/students/list', expect.objectContaining({
      method: 'POST', credentials: 'same-origin', body: JSON.stringify({ cursor: 'one' }),
    }));
  });
  it('refuses repeated cursors rather than loop forever', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ students: [], nextCursor: 'same' })));
    await expect(getStudents()).rejects.toThrow('Dienst niet beschikbaar.');
  });
});
