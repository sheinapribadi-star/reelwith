const MOMENTS = 'reelwith.moments.v1';
const LOGS = 'reelwith.logs.v1';

export function loadMoments() {
  try { return JSON.parse(localStorage.getItem(MOMENTS) || '[]'); } catch { return []; }
}
export function saveMoments(list) {
  localStorage.setItem(MOMENTS, JSON.stringify(list));
}
export function loadLogs() {
  try { return JSON.parse(localStorage.getItem(LOGS) || '[]'); } catch { return []; }
}
export function saveLogs(list) {
  localStorage.setItem(LOGS, JSON.stringify(list));
}
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
