import { describe, expect, it } from 'vitest';
import { GROWTH_STAGES } from './balance';
import { growthProgress, nextStage, stageForCarePoints } from './growth';

describe('stageForCarePoints', () => {
  it('케어 포인트에 맞는 단계를 고른다', () => {
    expect(stageForCarePoints(0).key).toBe('baby');
    expect(stageForCarePoints(9).key).toBe('baby');
    expect(stageForCarePoints(10).key).toBe('adolescent');
    expect(stageForCarePoints(29).key).toBe('adolescent');
    expect(stageForCarePoints(30).key).toBe('adult');
    expect(stageForCarePoints(999).key).toBe('adult');
  });

  it('음수여도 첫 단계로 떨어진다', () => {
    expect(stageForCarePoints(-5).key).toBe('baby');
  });
});

describe('nextStage', () => {
  it('마지막 단계 다음은 없다', () => {
    const last = GROWTH_STAGES[GROWTH_STAGES.length - 1]!;
    expect(nextStage(last)).toBeNull();
  });
});

describe('growthProgress', () => {
  it('다음 단계까지의 진행률을 계산한다', () => {
    const progress = growthProgress(5);
    expect(progress.current.key).toBe('baby');
    expect(progress.next?.key).toBe('adolescent');
    expect(progress.ratio).toBeCloseTo(0.5);
    expect(progress.remainingCarePoints).toBe(5);
  });

  it('최종 단계에서는 진행률이 1로 고정된다', () => {
    const progress = growthProgress(100);
    expect(progress.next).toBeNull();
    expect(progress.ratio).toBe(1);
    expect(progress.remainingCarePoints).toBe(0);
  });
});
