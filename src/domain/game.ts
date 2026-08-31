import { breedById, breedForMbti } from './breeds';
import { CARE_ACTIONS, CARE_POINTS_PER_ACTION, INITIAL_SATIETY } from './balance';
import { stageForCarePoints } from './growth';
import { clampGauge, projectGauges } from './stats';
import type {
  Breed,
  CareActionKey,
  GameState,
  GaugeKey,
  Gauges,
  GrowthStage,
  LedgerEntry,
  MbtiCode,
  Pet,
} from './types';

/** 저장 포맷 버전. 구조가 바뀌면 올리고 마이그레이션을 추가한다. */
export const STATE_VERSION = 1;

/**
 * 로컬에 보관하는 원장 길이 상한. Phase B에서는 서버가 전체 원장을 갖고
 * 클라이언트는 최근 내역만 캐시하므로, 지금부터 잘라도 설계가 어긋나지 않는다.
 */
export const LEDGER_LIMIT = 200;

export function createInitialState(): GameState {
  return { version: STATE_VERSION, pet: null, coins: 0, ledger: [] };
}

/**
 * 매칭된 견종의 특성치를 초기 게이지로 삼는다.
 * 허기만은 대응되는 특성이 없어 고정값에서 시작한다.
 */
export function createPet(mbti: MbtiCode, name: string, now: number): Pet {
  const breed = breedForMbti(mbti);
  return {
    id: `${breed.id}-${now}`,
    mbti,
    breedId: breed.id,
    name: name.trim() || breed.name,
    bornAt: now,
    gauges: {
      satiety: INITIAL_SATIETY,
      affection: clampGauge(breed.traits.affection),
      vitality: clampGauge(breed.traits.energy),
    },
    gaugesAt: now,
    carePoints: 0,
    lastActionAt: {},
  };
}

export function resolveBreed(pet: Pet): Breed | null {
  return breedById(pet.breedId);
}

/** 남은 쿨다운(ms). 0이면 지금 실행할 수 있다. */
export function cooldownRemaining(pet: Pet, action: CareActionKey, now: number): number {
  const last = pet.lastActionAt[action];
  if (last === undefined) return 0;
  const elapsed = now - last;
  // 시계가 뒤로 간 경우 쿨다운이 영원히 안 풀리지 않도록 경과를 0으로 본다.
  if (elapsed < 0) return CARE_ACTIONS[action].cooldownMs;
  return Math.max(0, CARE_ACTIONS[action].cooldownMs - elapsed);
}

export interface CareOutcome {
  action: CareActionKey;
  /** 실제로 적용된 게이지 증감 (상한/하한 클램프 반영 전 값) */
  gaugeDeltas: Partial<Gauges>;
  coins: number;
  stage: GrowthStage;
  /** 이번 행동으로 성장 단계가 올라갔는지 */
  grew: boolean;
}

export type CareActionResult =
  | { ok: true; state: GameState; outcome: CareOutcome }
  | { ok: false; reason: 'no-pet' | 'unknown-breed' }
  | { ok: false; reason: 'cooldown'; retryAfterMs: number };

/**
 * 케어 행동을 적용한 새 상태를 만든다. 입력을 변경하지 않는 순수 함수이며,
 * 무작위성·시계 참조가 없어 같은 (state, action, now)면 항상 같은 결과가 나온다.
 * Phase B에서 서버가 동일 함수로 클라이언트 결과를 재검증하기 위한 조건이다.
 */
export function applyCareAction(state: GameState, action: CareActionKey, now: number): CareActionResult {
  const pet = state.pet;
  if (!pet) return { ok: false, reason: 'no-pet' };

  const breed = resolveBreed(pet);
  if (!breed) return { ok: false, reason: 'unknown-breed' };

  const retryAfterMs = cooldownRemaining(pet, action, now);
  if (retryAfterMs > 0) return { ok: false, reason: 'cooldown', retryAfterMs };

  const spec = CARE_ACTIONS[action];
  const projected = projectGauges(pet, breed.traits, now);

  const deltas: Partial<Gauges> = { ...spec.base };
  if (spec.traitBonus) {
    const { gauge, trait, max } = spec.traitBonus;
    const bonus = (max * breed.traits[trait]) / 100;
    deltas[gauge] = (deltas[gauge] ?? 0) + bonus;
  }

  const gauges: Gauges = { ...projected };
  for (const key of Object.keys(deltas) as GaugeKey[]) {
    gauges[key] = clampGauge(gauges[key] + (deltas[key] ?? 0));
  }

  const carePoints = pet.carePoints + CARE_POINTS_PER_ACTION;
  const previousStage = stageForCarePoints(pet.carePoints);
  const stage = stageForCarePoints(carePoints);

  const nextPet: Pet = {
    ...pet,
    gauges,
    gaugesAt: now,
    carePoints,
    lastActionAt: { ...pet.lastActionAt, [action]: now },
  };

  // 쿨다운이 같은 밀리초 내 재실행을 막으므로 이 조합은 충돌하지 않는다.
  const entry: LedgerEntry = {
    id: `${pet.id}:${action}:${now}`,
    at: now,
    action,
    coinDelta: spec.coins,
  };

  return {
    ok: true,
    state: {
      ...state,
      pet: nextPet,
      coins: state.coins + spec.coins,
      ledger: [...state.ledger, entry].slice(-LEDGER_LIMIT),
    },
    outcome: {
      action,
      gaugeDeltas: deltas,
      coins: spec.coins,
      stage,
      grew: stage.key !== previousStage.key,
    },
  };
}
