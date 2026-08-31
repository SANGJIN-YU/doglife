import { GROWTH_STAGES } from './balance';
import type { GrowthStage } from './types';

/** 누적 케어 포인트에 해당하는 성장 단계. */
export function stageForCarePoints(carePoints: number): GrowthStage {
  let current = GROWTH_STAGES[0] as GrowthStage;
  for (const stage of GROWTH_STAGES) {
    if (carePoints >= stage.minCarePoints) {
      current = stage;
    }
  }
  return current;
}

export function nextStage(current: GrowthStage): GrowthStage | null {
  const index = GROWTH_STAGES.findIndex((stage) => stage.key === current.key);
  return GROWTH_STAGES[index + 1] ?? null;
}

export interface GrowthProgress {
  current: GrowthStage;
  next: GrowthStage | null;
  /** 다음 단계까지의 진행률 0~1. 최종 단계면 1. */
  ratio: number;
  remainingCarePoints: number;
}

export function growthProgress(carePoints: number): GrowthProgress {
  const current = stageForCarePoints(carePoints);
  const next = nextStage(current);
  if (!next) {
    return { current, next: null, ratio: 1, remainingCarePoints: 0 };
  }
  const span = next.minCarePoints - current.minCarePoints;
  const earned = carePoints - current.minCarePoints;
  return {
    current,
    next,
    ratio: span <= 0 ? 1 : Math.min(1, Math.max(0, earned / span)),
    remainingCarePoints: Math.max(0, next.minCarePoints - carePoints),
  };
}
