/**
 * 도메인 타입. 이 디렉터리의 코드는 브라우저 API를 일절 참조하지 않는다.
 * Phase B에서 동일한 모듈을 Supabase Edge Function(Deno)에서 그대로 실행해
 * 클라이언트가 보낸 결과를 재검증하기 위한 제약이다. (docs/architecture.md 참고)
 */

export const MBTI_CODES = [
  'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
  'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
  'INFP', 'INFJ', 'INTP', 'INTJ',
  'ISFP', 'ISFJ', 'ISTJ', 'ISTP',
] as const;

export type MbtiCode = (typeof MBTI_CODES)[number];

/** 견종 성향. 0~100. 게임 내에서는 변하지 않는 영구 스탯이다. */
export interface BreedTraits {
  /** 활력 게이지 감소 속도 */
  energy: number;
  /** 애정 게이지 감소 속도(높을수록 천천히 감소) */
  independence: number;
  /** 쓰다듬기 시 애정 획득량 */
  affection: number;
  /** 훈련 미니게임 성공률 (Phase A 미사용) */
  trainability: number;
}

export interface Breed {
  /** 서버 저장용 안정 키. 표시명이 바뀌어도 유지된다. */
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: BreedTraits;
}

/** 시간에 따라 감소하고 케어 행동으로 회복되는 게이지. 0~100. */
export type GaugeKey = 'satiety' | 'affection' | 'vitality';
export type Gauges = Record<GaugeKey, number>;

export type CareActionKey = 'feed' | 'walk' | 'pet';

export interface Pet {
  id: string;
  mbti: MbtiCode;
  breedId: string;
  name: string;
  bornAt: number;
  /**
   * 게이지 스냅샷과 그 시점. 현재 값은 projectGauges()로 경과 시간에서 유도한다.
   * 클라이언트 틱을 누적하지 않으므로 서버가 같은 입력으로 같은 값을 재현할 수 있다.
   */
  gauges: Gauges;
  gaugesAt: number;
  carePoints: number;
  /** 행동별 마지막 실행 시각. 쿨다운 판정의 유일한 근거. */
  lastActionAt: Partial<Record<CareActionKey, number>>;
}

/** 재화 변동 내역. append-only — Phase B에서 서버 원장과 대조하기 위한 형태. */
export interface LedgerEntry {
  id: string;
  at: number;
  action: CareActionKey;
  coinDelta: number;
}

export interface GameState {
  /** 저장 포맷 버전. 마이그레이션 판단에 사용한다. */
  version: number;
  pet: Pet | null;
  coins: number;
  ledger: LedgerEntry[];
}

export type GrowthStageKey = 'baby' | 'adolescent' | 'adult';

export interface GrowthStage {
  key: GrowthStageKey;
  label: string;
  /** 이 단계에 진입하는 데 필요한 누적 케어 포인트 */
  minCarePoints: number;
  /** 성장 단계별 크기 배율 — 비주얼 보상감 */
  scale: number;
}
