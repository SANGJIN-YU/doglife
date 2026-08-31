import { BASE_DECAY_PER_HOUR, DECAY_MODIFIER, GAUGE_CRITICAL, GAUGE_MAX, GAUGE_MIN, GAUGE_WARNING, HOUR } from './balance';
import type { BreedTraits, GaugeKey, Gauges, Pet } from './types';

export const GAUGE_KEYS: readonly GaugeKey[] = ['satiety', 'affection', 'vitality'];

export const GAUGE_LABELS: Record<GaugeKey, string> = {
  // 스펙에는 '허기'로 적혀 있지만, 게이지가 높을수록 배부른 상태라
  // 표시 문구는 뜻이 뒤집히지 않도록 '포만감'을 쓴다.
  satiety: '포만감',
  affection: '애정',
  vitality: '활력',
};

export function clampGauge(value: number): number {
  if (Number.isNaN(value)) return GAUGE_MIN;
  return Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, value));
}

function lerp(at0: number, at100: number, trait: number): number {
  return at0 + ((at100 - at0) * clampGauge(trait)) / 100;
}

/** 견종 특성이 반영된 시간당 게이지 감소량. */
export function decayRatesPerHour(traits: BreedTraits): Gauges {
  return {
    satiety: BASE_DECAY_PER_HOUR.satiety,
    affection:
      BASE_DECAY_PER_HOUR.affection *
      lerp(DECAY_MODIFIER.affection.at0, DECAY_MODIFIER.affection.at100, traits[DECAY_MODIFIER.affection.trait]),
    vitality:
      BASE_DECAY_PER_HOUR.vitality *
      lerp(DECAY_MODIFIER.vitality.at0, DECAY_MODIFIER.vitality.at100, traits[DECAY_MODIFIER.vitality.trait]),
  };
}

/**
 * 스냅샷과 경과 시간으로 현재 게이지를 유도한다.
 * 순수 함수이므로 같은 (pet, now)에 대해 서버도 동일한 값을 얻는다.
 * 기기 시계가 뒤로 간 경우(now < gaugesAt) 경과 시간을 0으로 본다.
 */
export function projectGauges(pet: Pet, traits: BreedTraits, now: number): Gauges {
  const elapsedHours = Math.max(0, now - pet.gaugesAt) / HOUR;
  if (elapsedHours === 0) {
    return { ...pet.gauges };
  }
  const rates = decayRatesPerHour(traits);
  return {
    satiety: clampGauge(pet.gauges.satiety - rates.satiety * elapsedHours),
    affection: clampGauge(pet.gauges.affection - rates.affection * elapsedHours),
    vitality: clampGauge(pet.gauges.vitality - rates.vitality * elapsedHours),
  };
}

export type GaugeStatus = 'critical' | 'warning' | 'normal';

export function gaugeStatus(value: number): GaugeStatus {
  if (value <= GAUGE_CRITICAL) return 'critical';
  if (value <= GAUGE_WARNING) return 'warning';
  return 'normal';
}

/** 세 게이지의 평균. 강아지 기분 표현에 사용한다. */
export function overallMood(gauges: Gauges): number {
  return (gauges.satiety + gauges.affection + gauges.vitality) / GAUGE_KEYS.length;
}
