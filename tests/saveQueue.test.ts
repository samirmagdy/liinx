import { describe, it, expect, vi, afterEach } from 'vitest';
import { SaveQueue } from '../src/utils/saveQueue';
afterEach(() => vi.useRealTimers());
describe('editor save queue', () => {
  it('merges nested block fields and retries the actual failed block payload', async () => {
    vi.useFakeTimers();
    const write = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const report = vi.fn();
    const queue = new SaveQueue(write, report);
    queue.enqueue('block-1', { extra: { artist: 'A' } });
    queue.enqueue('block-1', { extra: { coverUrl: 'https://example.com/a.png' } });
    await vi.runAllTimersAsync();
    expect(queue.dirty).toBe(true);
    expect(report).toHaveBeenLastCalledWith('error');
    expect(await queue.flush()).toBe(true);
    expect(write).toHaveBeenLastCalledWith('block-1', { extra: { artist: 'A', coverUrl: 'https://example.com/a.png' } });
    expect(queue.dirty).toBe(false);
  });
  it('serializes overlapping writes and stays dirty during in-flight requests', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const write = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; })).mockResolvedValue(undefined);
    const queue = new SaveQueue(write, vi.fn());
    queue.enqueue('profile', { bio: 'old' });
    const saving = queue.flush();
    expect(queue.dirty).toBe(true);
    queue.enqueue('profile', { bio: 'new' });
    await vi.advanceTimersByTimeAsync(600);
    expect(write).toHaveBeenCalledTimes(1);
    finish();
    await saving;
    expect(write).toHaveBeenLastCalledWith('profile', { bio: 'new' });
    expect(queue.dirty).toBe(false);
  });
  it('preserves newer edits over a failed request', async () => {
    vi.useFakeTimers();
    let reject!: (e: Error) => void;
    const write = vi.fn().mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
    const queue = new SaveQueue(write, vi.fn());
    queue.enqueue('b', { title: 'old', extra: { artist: 'A' } });
    const saving = queue.flush();
    queue.enqueue('b', { title: 'new', extra: { coverUrl: 'cover' } });
    reject(new Error('offline'));
    await saving;
    await queue.flush();
    expect(write).toHaveBeenLastCalledWith('b', { title: 'new', extra: { artist: 'A', coverUrl: 'cover' } });
  });
});
