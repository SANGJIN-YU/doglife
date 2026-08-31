import { GAUGE_LABELS, gaugeStatus, overallMood } from './stats';
import type { GaugeKey, Gauges } from './types';

export type MoodTone = 'happy' | 'neutral' | 'sad';

/** 가장 낮은 게이지. 동점이면 허기 → 애정 → 활력 순. */
export function weakestGauge(gauges: Gauges): GaugeKey {
  const order: readonly GaugeKey[] = ['satiety', 'affection', 'vitality'];
  return order.reduce((lowest, key) => (gauges[key] < gauges[lowest] ? key : lowest), order[0] as GaugeKey);
}

export function moodTone(gauges: Gauges): MoodTone {
  const weakest = gaugeStatus(gauges[weakestGauge(gauges)]);
  if (weakest === 'critical') return 'sad';
  if (weakest === 'warning') return 'neutral';
  return overallMood(gauges) >= 70 ? 'happy' : 'neutral';
}

const URGENT: Record<GaugeKey, string> = {
  satiety: '배가 너무 고파요. 밥을 주세요.',
  affection: '외로워하고 있어요. 쓰다듬어 주세요.',
  vitality: '답답해 보여요. 산책을 나가요.',
};

const MILD: Record<GaugeKey, string> = {
  satiety: '슬슬 배가 고픈 것 같아요.',
  affection: '곁에 와서 기다리고 있어요.',
  vitality: '창밖을 자꾸 쳐다봐요.',
};

/** 게이지 상태를 한 줄 메시지로 옮긴다. 표시 문구지만 순수 함수라 테스트할 수 있다. */
export function moodMessage(name: string, gauges: Gauges): string {
  const key = weakestGauge(gauges);
  const status = gaugeStatus(gauges[key]);
  if (status === 'critical') return URGENT[key];
  if (status === 'warning') return MILD[key];
  if (overallMood(gauges) >= 85) return `${name}가 아주 신이 났어요.`;
  return `${name}는 편안해 보여요.`;
}

export { GAUGE_LABELS };
