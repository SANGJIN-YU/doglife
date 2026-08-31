import { LocalGameRepository } from './localRepository';
import type { GameRepository } from './repository';

/**
 * Phase B에서 Supabase 구현을 추가하면 이 한 줄만 바꾼다.
 * 재화·수집 로직은 그때 서버 권위로 옮기고, 클라이언트는 요청만 보낸다.
 */
export const gameRepository: GameRepository = new LocalGameRepository();

export type { GameRepository } from './repository';
