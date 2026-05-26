export function todayISO(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function dayIndex(modulo: number, date = new Date()) {
  const start = Date.UTC(2024, 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((current - start) / 86_400_000);
  return ((days % modulo) + modulo) % modulo;
}

export function formatDateCN(dateISO = todayISO()) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${dateISO}T00:00:00`));
}
