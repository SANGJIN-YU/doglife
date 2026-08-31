import { describe, expect, it } from 'vitest';
import { createInitialState, createPet } from '../domain/game';
import { parseGameState } from './serialization';

const T0 = 1_700_000_000_000;

function roundTrip(state: unknown) {
  return parseGameState(JSON.parse(JSON.stringify(state)));
}

describe('parseGameState', () => {
  it('저장한 상태를 그대로 복원한다', () => {
    const state = { ...createInitialState(), pet: createPet('ENFP', '코코', T0), coins: 12 };
    expect(roundTrip(state)).toEqual(state);
  });

  it('강아지가 없는 상태도 복원한다', () => {
    expect(roundTrip(createInitialState())).toEqual(createInitialState());
  });

  it('형태가 아닌 값은 버린다', () => {
    expect(parseGameState(null)).toBeNull();
    expect(parseGameState('무엇')).toBeNull();
    expect(parseGameState([])).toBeNull();
  });

  it('버전이 다르면 버린다', () => {
    expect(parseGameState({ ...createInitialState(), version: 99 })).toBeNull();
  });

  it('알 수 없는 견종이면 강아지를 버린다', () => {
    const state = { ...createInitialState(), pet: { ...createPet('ENFP', '코코', T0), breedId: '없는견종' } };
    expect(roundTrip(state)?.pet).toBeNull();
  });

  it('조작된 게이지를 범위 안으로 자른다', () => {
    const pet = createPet('ENFP', '코코', T0);
    const state = { ...createInitialState(), pet: { ...pet, gauges: { satiety: 9999, affection: -5, vitality: 50 } } };
    expect(roundTrip(state)?.pet?.gauges).toEqual({ satiety: 100, affection: 0, vitality: 50 });
  });

  it('음수 코인을 0으로 되돌린다', () => {
    expect(roundTrip({ ...createInitialState(), coins: -100 })?.coins).toBe(0);
  });

  it('원장에서 깨진 항목만 걸러낸다', () => {
    const state = {
      ...createInitialState(),
      ledger: [
        { id: 'a', at: T0, action: 'feed', coinDelta: 3 },
        { id: 'b', at: T0, action: '해킹', coinDelta: 9999 },
        '문자열',
      ],
    };
    const parsed = roundTrip(state);
    expect(parsed?.ledger).toEqual([{ id: 'a', at: T0, action: 'feed', coinDelta: 3 }]);
  });
});
