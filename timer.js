export const defaults = { focus: 25, short: 5, long: 15 };
export class Timer {
  constructor(saved = {}) {
    saved = saved && typeof saved === 'object' ? saved : {};
    this.durations = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key,
      Number.isInteger(saved.durations?.[key]) && saved.durations[key] >= 1 && saved.durations[key] <= 120 ? saved.durations[key] : value]));
    this.mode = Object.hasOwn(defaults, saved.mode) ? saved.mode : 'focus';
    this.completed = Number.isSafeInteger(saved.completed) && saved.completed >= 0 ? saved.completed : 0;
    this.remaining = Number.isFinite(saved.remaining) && saved.remaining >= 0 && saved.remaining <= this.total ? saved.remaining : this.total;
    this.running = saved.running === true && Number.isFinite(saved.endsAt) && saved.endsAt > 0;
    this.endsAt = this.running ? saved.endsAt : null;
  }
  get total() { return this.durations[this.mode] * 60000; }
  get nextMode() { return this.mode === 'focus' ? (this.remaining === 0 && this.completed > 0 && this.completed % 4 === 0 ? 'long' : 'short') : 'focus'; }
  start(now = Date.now()) {
    if (this.running || this.remaining === 0) return;
    this.endsAt = now + this.remaining;
    this.running = true;
  }
  tick(now = Date.now()) {
    if (!this.running) return false;
    this.remaining = Math.max(0, this.endsAt - now);
    if (this.remaining > 0) return false;
    this.running = false;
    this.endsAt = null;
    if (this.mode === 'focus') this.completed++;
    return true;
  }
  pause(now = Date.now()) { const finished = this.tick(now); this.running = false; this.endsAt = null; return finished; }
  reset() { this.running = false; this.endsAt = null; this.remaining = this.total; }
  select(mode) { if (Object.hasOwn(defaults, mode)) { this.mode = mode; this.reset(); } }
  skip() { this.select(this.nextMode); }
}
