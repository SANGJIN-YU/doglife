const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** 쿨다운 남은 시간. 1시간 미만이면 mm:ss, 이상이면 h:mm:ss. */
export function formatCooldown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / SECOND));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** 함께한 기간을 사람이 읽는 문구로. */
export function formatTogether(ms: number): string {
  if (ms < HOUR) return '오늘 만났어요';
  if (ms < DAY) return `함께한 지 ${Math.floor(ms / HOUR)}시간`;
  return `함께한 지 ${Math.floor(ms / DAY)}일`;
}
