import { parseGameState } from './serialization';
import type { GameRepository } from './repository';
import type { GameState } from '../domain/types';

export const STORAGE_KEY = 'doglife.game.v1';

/**
 * localStorage 기반 구현. 시크릿 모드나 저장 차단 환경에서 접근 자체가
 * 던질 수 있으므로 모든 호출을 감싼다. 저장에 실패해도 게임은 계속 돌아간다.
 */
export class LocalGameRepository implements GameRepository {
  constructor(private readonly storageKey: string = STORAGE_KEY) {}

  private get storage(): Storage | null {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  async load(): Promise<GameState | null> {
    const storage = this.storage;
    if (!storage) return null;
    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) return null;
      return parseGameState(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async save(state: GameState): Promise<void> {
    const storage = this.storage;
    if (!storage) return;
    try {
      storage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // 용량 초과나 저장 차단. 진행 상황만 잃고 세션은 유지한다.
    }
  }

  async clear(): Promise<void> {
    const storage = this.storage;
    if (!storage) return;
    try {
      storage.removeItem(this.storageKey);
    } catch {
      // 무시
    }
  }
}
