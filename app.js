import { Timer } from './timer.js';
import { Alarm } from './alarm.js';
const $ = (id) => document.getElementById(id);
const key = 'cad-pomodoro-v1';
const labels = { focus: 'Focus', short: 'Short break', long: 'Long break' };
let saved = {};
try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch { /* A fresh session works without storage. */ }
const timer = new Timer(saved.timer);
let sound = saved.sound !== false;
const alarm=new Alarm(undefined,message=>{ $('sound-status').textContent=message; });
alarm.setEnabled(sound);
$('task').value = typeof saved.task === 'string' ? saved.task.slice(0, 160) : '';
$('sound').checked = sound;
for (const name of Object.keys(timer.durations)) $('settings-form').elements[name].value = timer.durations[name];
function persist() {
  try { localStorage.setItem(key, JSON.stringify({ timer, sound, task: $('task').value })); }
  catch { $('storage-note').textContent = 'Browser storage is unavailable. Your timer works, but progress cannot be saved. Keep this page open to hear the sound.'; }
}
function announce(message) { $('announcement').textContent = message; }
function unlockAudio() {
  void alarm.unlock();
}
function finish() { void alarm.ring(); announce(`${labels[timer.mode]} finished. ${labels[timer.nextMode]} is ready when you are.`); persist(); }
function render() {
  const seconds = Math.ceil(timer.remaining / 1000);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('clock').textContent = time;
  $('clock').setAttribute('aria-label', `${Math.floor(seconds / 60)} minutes, ${seconds % 60} seconds remaining`);
  document.title = `${time} · ${labels[timer.mode]} | Code A Difference`;
  document.querySelector('.timer-panel').dataset.mode = timer.mode;
  document.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === timer.mode)));
  const finished = timer.remaining === 0;
  $('session-label').textContent = finished ? 'Session complete. Take a breath.' : timer.mode === 'focus' ? (timer.running ? 'One thing at a time.' : 'Time to focus') : 'Time to take a breather';
  $('timer-hint').textContent = finished ? `${labels[timer.nextMode]} is ready when you are.` : timer.mode === 'focus' ? 'You don’t have to finish everything. Just begin.' : 'Step away, stretch, or get a little water.';
  $('toggle').textContent = finished ? `Start ${timer.nextMode === 'focus' ? 'focus' : 'break'}` : timer.running ? 'Pause' : timer.remaining < timer.total ? 'Resume' : timer.mode === 'focus' ? 'Start focus' : 'Start break';
  const progress = Math.round((1 - timer.remaining / timer.total) * 100);
  $('progress').style.width = `${progress}%`;
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow', String(progress));
  $('completed').textContent = timer.completed;
  const dots = timer.completed % 4 || (timer.completed > 0 ? 4 : 0);
  [...$('session-dots').children].forEach((dot, index) => dot.classList.toggle('done', index < dots));
  $('round').textContent = timer.mode === 'focus' ? `Focus session ${finished ? ((timer.completed - 1) % 4) + 1 : timer.completed % 4 + 1} of 4` : 'A break, well deserved';
  const next = timer.nextMode;
  // During an unfinished focus, the upcoming fourth completion earns a long break.
  const upcoming = timer.mode === 'focus' && !finished ? ((timer.completed + 1) % 4 === 0 ? 'long' : 'short') : next;
  $('next').textContent = `Next: ${timer.durations[upcoming]}-minute ${upcoming === 'focus' ? 'focus' : 'break'}`;
}
$('toggle').addEventListener('click', () => {
  unlockAudio();
  if (timer.running) { if (timer.pause()) finish(); else announce('Timer paused.'); }
  else { if (timer.remaining === 0) timer.skip(); timer.start(); announce(`${labels[timer.mode]} started.`); }
  persist(); render();
});
$('reset').addEventListener('click', () => { timer.reset(); persist(); render(); announce('Current session reset.'); });
$('skip').addEventListener('click', () => { timer.skip(); persist(); render(); announce(`${labels[timer.mode]} ready. Press Start when you are ready.`); });
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  timer.select(button.dataset.mode); persist(); render(); announce(`${labels[timer.mode]} selected. Timer reset.`);
}));
$('task').addEventListener('input', persist);
$('sound').addEventListener('change', () => { sound = $('sound').checked; alarm.setEnabled(sound); $('sound-status').textContent=sound?'Beep enabled.':'Beep off.'; unlockAudio(); persist(); });
$('test-beep').addEventListener('click',()=>{
  sound=true;$('sound').checked=true;alarm.setEnabled(true);persist();void alarm.ring();
});
document.addEventListener('pointerdown',unlockAudio);
document.addEventListener('keydown',unlockAudio);
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  for (const name of Object.keys(timer.durations)) timer.durations[name] = Number(form.elements[name].value);
  timer.reset(); persist(); render(); $('settings-status').textContent = 'Settings saved. Current session reset.';
});
function update() { if (timer.tick()) finish(); render(); }
document.addEventListener('visibilitychange', update);
window.addEventListener('pagehide', persist);
setInterval(update, 250);
update();
