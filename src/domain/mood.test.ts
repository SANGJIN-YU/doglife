import { describe, expect, it } from 'vitest';
import { moodMessage, moodTone, weakestGauge } from './mood';

describe('weakestGauge', () => {
  it('가장 낮은 게이지를 고른다', () => {
    expect(weakestGauge({ satiety: 80, affection: 20, vitality: 60 })).toBe('affection');
  });

  it('동점이면 허기를 우선한다', () => {
    expect(weakestGauge({ satiety: 30, affection: 30, vitality: 90 })).toBe('satiety');
  });
});

describe('moodTone', () => {
  it('하나라도 위험하면 슬픈 상태', () => {
    expect(moodTone({ satiety: 100, affection: 100, vitality: 5 })).toBe('sad');
  });

  it('전부 충분하면 기쁜 상태', () => {
    expect(moodTone({ satiety: 90, affection: 85, vitality: 80 })).toBe('happy');
  });

  it('평균이 낮으면 기쁘지 않다', () => {
    expect(moodTone({ satiety: 50, affection: 45, vitality: 40 })).toBe('neutral');
  });
});

describe('moodMessage', () => {
  it('가장 급한 게이지를 짚어준다', () => {
    expect(moodMessage('코코', { satiety: 5, affection: 90, vitality: 90 })).toContain('밥');
    expect(moodMessage('코코', { satiety: 90, affection: 5, vitality: 90 })).toContain('쓰다듬');
    expect(moodMessage('코코', { satiety: 90, affection: 90, vitality: 5 })).toContain('산책');
  });

  it('상태가 좋으면 이름을 넣어 말한다', () => {
    expect(moodMessage('코코', { satiety: 95, affection: 95, vitality: 95 })).toContain('코코');
  });
});
