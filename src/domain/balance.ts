import type { BreedTraits, CareActionKey, GaugeKey, Gauges, GrowthStage } from './types';

/**
 * 밸런스 상수를 한 곳에 모아둔다. 스펙상 유형별 유불리는 의도된 것이고,
 * 수치 조정은 알파 단계에서 이 파일만 고치면 되도록 한다.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export const GAUGE_MIN = 0;
export const GAUGE_MAX = 100;

/** 게이지가 이 값 아래로 내려가면 경고 상태로 표시한다. */
export const GAUGE_WARNING = 30;
export const GAUGE_CRITICAL = 15;

/** 특성 보정 전, 시간당 기본 감소량. */
export const BASE_DECAY_PER_HOUR: Gauges = {
  satiety: 8,
  affection: 6,
  vitality: 7,
};

/**
 * 특성 보정 계수의 범위. 특성치 0이면 min, 100이면 max가 된다.
 * - 애정: 독립성이 높을수록 천천히 감소 (역방향)
 * - 활력: 에너지가 높을수록 빨리 감소 → 산책이 자주 필요
 */
export const DECAY_MODIFIER = {
  affection: { trait: 'independence' as const, at0: 1.35, at100: 0.65 },
  vitality: { trait: 'energy' as const, at0: 0.65, at100: 1.35 },
} satisfies Partial<
  Record<GaugeKey, { trait: keyof BreedTraits; at0: number; at100: number }>
>;

export interface CareActionSpec {
  key: CareActionKey;
  label: string;
  emoji: string;
  /** 결과 화면에 쓰는 짧은 설명 */
  hint: string;
  cooldownMs: number;
  /** 행동 완료 시 지급되는 간식 코인 */
  coins: number;
  /** 특성과 무관한 고정 증감량 */
  base: Partial<Gauges>;
  /** 견종 특성에 비례해 추가로 붙는 획득량 (특성 100일 때 max) */
  traitBonus?: { gauge: GaugeKey; trait: keyof BreedTraits; max: number };
}

/**
 * 쿨다운은 알파 기준값이다. 실제 방치형 게임 템포보다 짧게 잡아
 * 한 세션 안에서 루프를 여러 번 돌려볼 수 있게 했다.
 */
export const CARE_ACTIONS: Record<CareActionKey, CareActionSpec> = {
  feed: {
    key: 'feed',
    label: '밥주기',
    emoji: '🍚',
    hint: '허기를 채워요',
    cooldownMs: 30 * MINUTE,
    coins: 3,
    base: { satiety: 35, affection: 2 },
  },
  walk: {
    key: 'walk',
    label: '산책',
    emoji: '🦴',
    hint: '활력을 채우고 배가 고파져요',
    cooldownMs: 45 * MINUTE,
    coins: 5,
    base: { vitality: 30, affection: 5, satiety: -8 },
    traitBonus: { gauge: 'vitality', trait: 'energy', max: 10 },
  },
  pet: {
    key: 'pet',
    label: '쓰다듬기',
    emoji: '🤍',
    hint: '애정을 채워요',
    cooldownMs: 5 * MINUTE,
    coins: 1,
    base: { affection: 10 },
    traitBonus: { gauge: 'affection', trait: 'affection', max: 15 },
  },
};

export const CARE_ACTION_ORDER: readonly CareActionKey[] = ['feed', 'walk', 'pet'];

/** 케어 행동 1회당 누적되는 성장 포인트. */
export const CARE_POINTS_PER_ACTION = 1;

/** minCarePoints 내림차순으로 조회하므로 오름차순 정렬을 유지할 것. */
export const GROWTH_STAGES: readonly GrowthStage[] = [
  { key: 'baby', label: '아기', minCarePoints: 0, scale: 1 },
  { key: 'adolescent', label: '청소년', minCarePoints: 10, scale: 1.3 },
  { key: 'adult', label: '성견', minCarePoints: 30, scale: 1.6 },
];

/** 새 강아지의 초기 게이지 중 허기만 특성과 무관하게 고정한다. */
export const INITIAL_SATIETY = 80;
