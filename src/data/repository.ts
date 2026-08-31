import type { GameState } from '../domain/types';

/**
 * 저장소 경계. Phase A는 localStorage 구현 하나뿐이지만,
 * Phase B에서 Supabase 구현으로 갈아끼울 때 UI가 바뀌지 않도록
 * 지금부터 비동기 인터페이스로 고정한다.
 */
export interface GameRepository {
  load(): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}
