export function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.textContent = isLight ? '☀️' : '🌙';
  });
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
export function applyStoredTheme() {
  const t = localStorage.getItem('theme');
  if (t === 'light') {
    document.body.classList.add('light');
    document.querySelectorAll('.btn-theme').forEach(btn => btn.textContent = '☀️');
  }
}
