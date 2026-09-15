export type SaveState = 'saved' | 'saving' | 'error';
type Patch = Record<string, any>;
export function mergePatch(a: Patch, b: Patch): Patch {
  const result = { ...a, ...b };
  for (const key of ['extra', 'customTheme']) {
    if (a[key] && b[key]) result[key] = { ...a[key], ...b[key] };
  }
  return result;
}

/** One ordered writer. Failed payloads remain pending until explicitly retried. */
export class SaveQueue {
  private pending = new Map<string, Patch>();
  private running = false;
  private failed = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private write: (key: string, patch: Patch) => Promise<unknown>,
    private report: (state: SaveState) => void, private delay = 500) {}
  get dirty() { return this.running || this.pending.size > 0; }
  enqueue(key: string, patch: Patch) {
    this.pending.set(key, mergePatch(this.pending.get(key) || {}, patch));
    this.report(this.failed ? 'error' : 'saving');
    clearTimeout(this.timer);
    if (!this.failed) this.timer = setTimeout(() => void this.flush(), this.delay);
  }
  async flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.running) return false;
    this.failed = false;
    this.running = true;
    this.report('saving');
    try {
      while (this.pending.size) {
        const [key, patch] = this.pending.entries().next().value!;
        this.pending.delete(key);
        try { await this.write(key, patch); }
        catch {
          this.pending.set(key, mergePatch(patch, this.pending.get(key) || {}));
          this.failed = true;
          this.report('error');
          return false;
        }
      }
      this.report('saved');
      return true;
    } finally { this.running = false; }
  }
  dispose() { clearTimeout(this.timer); }
}
