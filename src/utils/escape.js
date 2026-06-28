// HTML 跳脫，防止 XSS
export function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
export function formatTime(s) {
  const m = Math.floor(s/60);
  return `${m.toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}
