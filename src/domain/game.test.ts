import { describe, expect, it } from 'vitest';
import { CARE_ACTIONS, HOUR, MINUTE } from './balance';
import { BREEDS } from './breeds';
import {
  applyCareAction,
  cooldownRemaining,
  createInitialState,
  createPet,
  LEDGER_LIMIT,
} from './game';
import type { GameState } from './types';

const T0 = 1_700_000_000_000;

function stateWithPet(mbti: Parameters<typeof createPet>[0] = 'ENFP', now = T0): GameState {
  return { ...createInitialState(), pet: createPet(mbti, '코코', now) };
}

/** 쿨다운을 피해가며 같은 행동을 n번 반복한다. */
function repeat(state: GameState, action: 'feed' | 'walk' | 'pet', times: number, startAt: number): GameState {
  let current = state;
  let at = startAt;
  for (let i = 0; i < times; i += 1) {
    const result = applyCareAction(current, action, at);
    if (!result.ok) throw new Error(`행동 실패: ${result.reason}`);
    current = result.state;
    at += CARE_ACTIONS[action].cooldownMs;
  }
  return current;
}

describe('createPet', () => {
  it('견종 특성치를 초기 게이지로 삼는다', () => {
    const pet = createPet('ISFJ', '보리', T0);
    expect(pet.gauges.affection).toBe(BREEDS.ISFJ.traits.affection);
    expect(pet.gauges.vitality).toBe(BREEDS.ISFJ.traits.energy);
  });

  it('이름이 비어 있으면 견종명을 쓴다', () => {
    expect(createPet('ENFP', '   ', T0).name).toBe(BREEDS.ENFP.name);
  });

  it('쿨다운 없이 시작한다', () => {
    const pet = createPet('ENFP', '코코', T0);
    expect(cooldownRemaining(pet, 'feed', T0)).toBe(0);
  });
});

describe('applyCareAction', () => {
  it('강아지가 없으면 거절한다', () => {
    const result = applyCareAction(createInitialState(), 'feed', T0);
    expect(result).toEqual({ ok: false, reason: 'no-pet' });
  });

  it('밥주기가 허기를 채우고 코인을 지급한다', () => {
    const result = applyCareAction(stateWithPet(), 'feed', T0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pet!.gauges.satiety).toBeGreaterThan(80);
    expect(result.state.coins).toBe(CARE_ACTIONS.feed.coins);
    expect(result.state.ledger).toHaveLength(1);
  });

  it('산책은 활력을 채우는 대신 허기를 소모한다', () => {
    const before = stateWithPet();
    const result = applyCareAction(before, 'walk', T0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pet!.gauges.vitality).toBeGreaterThan(before.pet!.gauges.vitality);
    expect(result.state.pet!.gauges.satiety).toBeLessThan(before.pet!.gauges.satiety);
  });

  it('애정도가 높은 견종일수록 쓰다듬기 획득량이 크다', () => {
    // 게이지 상한에 걸리지 않도록 충분히 방치한 뒤 비교한다.
    const at = T0 + 12 * HOUR;
    const warm = applyCareAction(stateWithPet('ISFJ'), 'pet', at); // 애정도 95
    const aloof = applyCareAction(stateWithPet('INTP'), 'pet', at); // 애정도 40
    expect(warm.ok && aloof.ok).toBe(true);
    if (!warm.ok || !aloof.ok) return;
    expect(warm.outcome.gaugeDeltas.affection!).toBeGreaterThan(aloof.outcome.gaugeDeltas.affection!);
  });

  it('쿨다운 중에는 남은 시간과 함께 거절한다', () => {
    const first = applyCareAction(stateWithPet(), 'feed', T0);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const tooSoon = applyCareAction(first.state, 'feed', T0 + MINUTE);
    expect(tooSoon.ok).toBe(false);
    if (tooSoon.ok || tooSoon.reason !== 'cooldown') throw new Error('쿨다운으로 거절되어야 한다');
    expect(tooSoon.retryAfterMs).toBe(CARE_ACTIONS.feed.cooldownMs - MINUTE);
  });

  it('쿨다운이 끝나면 다시 실행할 수 있다', () => {
    const first = applyCareAction(stateWithPet(), 'feed', T0);
    if (!first.ok) throw new Error('첫 행동은 성공해야 한다');
    const again = applyCareAction(first.state, 'feed', T0 + CARE_ACTIONS.feed.cooldownMs);
    expect(again.ok).toBe(true);
  });

  it('한 행동의 쿨다운이 다른 행동을 막지 않는다', () => {
    const fed = applyCareAction(stateWithPet(), 'feed', T0);
    if (!fed.ok) throw new Error('밥주기는 성공해야 한다');
    expect(applyCareAction(fed.state, 'pet', T0).ok).toBe(true);
  });

  it('행동 전에 경과 시간만큼 게이지를 먼저 감소시킨다', () => {
    const state = stateWithPet();
    const result = applyCareAction(state, 'pet', T0 + 10 * HOUR);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 10시간 방치했으므로 애정을 채워도 시작값보다 낮아야 한다.
    expect(result.state.pet!.gauges.affection).toBeLessThan(state.pet!.gauges.affection);
  });

  it('게이지가 100을 넘지 않는다', () => {
    const state = repeat(stateWithPet(), 'feed', 5, T0);
    expect(state.pet!.gauges.satiety).toBeLessThanOrEqual(100);
  });

  it('입력 상태를 변경하지 않는다', () => {
    const before = stateWithPet();
    const snapshot = structuredClone(before);
    applyCareAction(before, 'feed', T0);
    expect(before).toEqual(snapshot);
  });

  it('같은 입력이면 같은 결과가 나온다 — 서버 재검증의 전제', () => {
    const state = stateWithPet();
    const a = applyCareAction(state, 'walk', T0 + HOUR);
    const b = applyCareAction(state, 'walk', T0 + HOUR);
    expect(a).toEqual(b);
  });

  it('원장 항목 id가 겹치지 않는다', () => {
    const state = repeat(stateWithPet(), 'pet', 10, T0);
    const ids = new Set(state.ledger.map((entry) => entry.id));
    expect(ids.size).toBe(state.ledger.length);
  });

  it('코인 합계가 원장 합계와 일치한다', () => {
    const state = repeat(stateWithPet(), 'pet', 8, T0);
    const sum = state.ledger.reduce((total, entry) => total + entry.coinDelta, 0);
    expect(state.coins).toBe(sum);
  });

  it('원장은 상한을 넘지 않는다', () => {
    const state = repeat(stateWithPet(), 'pet', LEDGER_LIMIT + 20, T0);
    expect(state.ledger).toHaveLength(LEDGER_LIMIT);
    expect(state.coins).toBe((LEDGER_LIMIT + 20) * CARE_ACTIONS.pet.coins);
  });
});

describe('성장', () => {
  it('케어 포인트가 쌓이면 단계가 올라간다', () => {
    const state = repeat(stateWithPet(), 'pet', 10, T0);
    expect(state.pet!.carePoints).toBe(10);

    const result = applyCareAction(
      repeat(stateWithPet(), 'pet', 9, T0),
      'pet',
      T0 + 9 * CARE_ACTIONS.pet.cooldownMs,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome.grew).toBe(true);
    expect(result.outcome.stage.key).toBe('adolescent');
  });

  it('단계가 그대로면 성장 플래그가 서지 않는다', () => {
    const result = applyCareAction(stateWithPet(), 'pet', T0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome.grew).toBe(false);
  });
});
