import { describe, expect, it } from 'vitest';
import { formatCooldown, formatTogether } from './time';

describe('formatCooldown', () => {
  it('1시간 미만은 mm:ss', () => {
    expect(formatCooldown(90_000)).toBe('01:30');
  });

  it('1시간 이상은 시간을 앞에 붙인다', () => {
    expect(formatCooldown(3_930_000)).toBe('1:05:30');
  });

  it('음수는 0으로 본다', () => {
    expect(formatCooldown(-500)).toBe('00:00');
  });

  it('남은 시간을 올림해 0초로 보이지 않게 한다', () => {
    expect(formatCooldown(1)).toBe('00:01');
  });
});

describe('formatTogether', () => {
  it('구간별 문구를 돌려준다', () => {
    expect(formatTogether(60_000)).toBe('오늘 만났어요');
    expect(formatTogether(5 * 3_600_000)).toBe('함께한 지 5시간');
    expect(formatTogether(3 * 86_400_000)).toBe('함께한 지 3일');
  });
});
