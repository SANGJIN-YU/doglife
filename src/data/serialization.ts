import { STATE_VERSION, createInitialState } from '../domain/game';
import { MBTI_CODES } from '../domain/types';
import { breedById } from '../domain/breeds';
import { clampGauge } from '../domain/stats';
import type { CareActionKey, GameState, LedgerEntry, MbtiCode, Pet } from '../domain/types';

/**
 * 저장된 값은 사용자가 편집할 수 있으므로 신뢰하지 않는다.
 * 형태가 어긋나면 조용히 버리고 초기 상태로 돌아간다.
 */

const CARE_ACTION_KEYS: readonly CareActionKey[] = ['feed', 'walk', 'pet'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parsePet(raw: unknown): Pet | null {
  if (!isRecord(raw)) return null;

  const mbti = raw['mbti'];
  if (typeof mbti !== 'string' || !(MBTI_CODES as readonly string[]).includes(mbti)) return null;

  const breedId = raw['breedId'];
  if (typeof breedId !== 'string' || !breedById(breedId)) return null;

  const id = raw['id'];
  if (typeof id !== 'string' || id.length === 0) return null;

  const gaugesRaw = isRecord(raw['gauges']) ? raw['gauges'] : {};
  const now = Date.now();

  const lastActionAt: Partial<Record<CareActionKey, number>> = {};
  const lastActionRaw = isRecord(raw['lastActionAt']) ? raw['lastActionAt'] : {};
  for (const key of CARE_ACTION_KEYS) {
    const at = lastActionRaw[key];
    if (typeof at === 'number' && Number.isFinite(at)) {
      lastActionAt[key] = at;
    }
  }

  return {
    id,
    mbti: mbti as MbtiCode,
    breedId,
    name: typeof raw['name'] === 'string' && raw['name'].trim() ? raw['name'] : '이름 없는 강아지',
    bornAt: finiteNumber(raw['bornAt'], now),
    gauges: {
      satiety: clampGauge(finiteNumber(gaugesRaw['satiety'], 0)),
      affection: clampGauge(finiteNumber(gaugesRaw['affection'], 0)),
      vitality: clampGauge(finiteNumber(gaugesRaw['vitality'], 0)),
    },
    gaugesAt: finiteNumber(raw['gaugesAt'], now),
    carePoints: Math.max(0, Math.floor(finiteNumber(raw['carePoints'], 0))),
    lastActionAt,
  };
}

function parseLedger(raw: unknown): LedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: LedgerEntry[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const action = item['action'];
    if (typeof action !== 'string' || !CARE_ACTION_KEYS.includes(action as CareActionKey)) continue;
    if (typeof item['id'] !== 'string') continue;
    entries.push({
      id: item['id'],
      at: finiteNumber(item['at'], 0),
      action: action as CareActionKey,
      coinDelta: finiteNumber(item['coinDelta'], 0),
    });
  }
  return entries;
}

/** 저장된 JSON을 GameState로 되돌린다. 복구할 수 없으면 null. */
export function parseGameState(raw: unknown): GameState | null {
  if (!isRecord(raw)) return null;
  if (finiteNumber(raw['version'], 0) !== STATE_VERSION) return null;

  const base = createInitialState();
  return {
    ...base,
    pet: raw['pet'] === null || raw['pet'] === undefined ? null : parsePet(raw['pet']),
    coins: Math.max(0, Math.floor(finiteNumber(raw['coins'], 0))),
    ledger: parseLedger(raw['ledger']),
  };
}
