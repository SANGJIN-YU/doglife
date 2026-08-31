import { useCallback, useEffect, useState } from 'react';
import { gameRepository } from '../data';
import { applyCareAction, createInitialState, createPet } from '../domain/game';
import type { CareActionResult } from '../domain/game';
import type { CareActionKey, GameState, MbtiCode } from '../domain/types';

export interface UseGameResult {
  /** 저장소를 읽는 동안 false */
  loaded: boolean;
  state: GameState;
  startRaising: (mbti: MbtiCode, name: string) => void;
  care: (action: CareActionKey) => CareActionResult;
  reset: () => void;
}

/**
 * 게임 상태를 저장소에서 읽어오고, 도메인 함수의 결과를 다시 저장한다.
 * 상태 전이 규칙은 전부 domain/에 있고 이 훅은 배선만 담당한다.
 */
export function useGame(): UseGameResult {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void gameRepository.load().then((loaded) => {
      if (!cancelled) setState(loaded ?? createInitialState());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: GameState) => {
    setState(next);
    void gameRepository.save(next);
  }, []);

  const startRaising = useCallback(
    (mbti: MbtiCode, name: string) => {
      const base = state ?? createInitialState();
      persist({ ...base, pet: createPet(mbti, name, Date.now()) });
    },
    [state, persist],
  );

  const care = useCallback(
    (action: CareActionKey): CareActionResult => {
      if (!state) return { ok: false, reason: 'no-pet' };
      const result = applyCareAction(state, action, Date.now());
      if (result.ok) persist(result.state);
      return result;
    },
    [state, persist],
  );

  const reset = useCallback(() => {
    const next = createInitialState();
    setState(next);
    void gameRepository.clear();
  }, []);

  return {
    loaded: state !== null,
    state: state ?? createInitialState(),
    startRaising,
    care,
    reset,
  };
}
