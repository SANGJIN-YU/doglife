import { describe, expect, it } from 'vitest';
import { HOUR } from './balance';
import { BREEDS } from './breeds';
import { clampGauge, decayRatesPerHour, gaugeStatus, projectGauges } from './stats';
import { createPet } from './game';

const T0 = 1_700_000_000_000;

describe('clampGauge', () => {
  it('0~100 범위로 자른다', () => {
    expect(clampGauge(-20)).toBe(0);
    expect(clampGauge(140)).toBe(100);
    expect(clampGauge(42)).toBe(42);
  });

  it('NaN은 최소값으로 떨어뜨린다', () => {
    expect(clampGauge(Number.NaN)).toBe(0);
  });
});

describe('decayRatesPerHour', () => {
  it('독립성이 높을수록 애정이 천천히 감소한다', () => {
    const independent = decayRatesPerHour(BREEDS.INTP.traits); // 독립성 90
    const clingy = decayRatesPerHour(BREEDS.ISFJ.traits); // 독립성 15
    expect(independent.affection).toBeLessThan(clingy.affection);
  });

  it('에너지가 높을수록 활력이 빨리 감소한다', () => {
    const active = decayRatesPerHour(BREEDS.ESTP.traits); // 에너지 95
    const calm = decayRatesPerHour(BREEDS.ISFP.traits); // 에너지 30
    expect(active.vitality).toBeGreaterThan(calm.vitality);
  });

  it('허기는 견종과 무관하게 같은 속도로 감소한다', () => {
    expect(decayRatesPerHour(BREEDS.ESTP.traits).satiety).toBe(
      decayRatesPerHour(BREEDS.ISFP.traits).satiety,
    );
  });
});

describe('projectGauges', () => {
  it('경과 시간이 0이면 스냅샷을 그대로 돌려준다', () => {
    const pet = createPet('ENFP', '코코', T0);
    expect(projectGauges(pet, BREEDS.ENFP.traits, T0)).toEqual(pet.gauges);
  });

  it('시간이 지나면 게이지가 감소한다', () => {
    const pet = createPet('ENFP', '코코', T0);
    const later = projectGauges(pet, BREEDS.ENFP.traits, T0 + 3 * HOUR);
    expect(later.satiety).toBeLessThan(pet.gauges.satiety);
    expect(later.affection).toBeLessThan(pet.gauges.affection);
    expect(later.vitality).toBeLessThan(pet.gauges.vitality);
  });

  it('아무리 오래 방치해도 0 아래로 내려가지 않는다', () => {
    const pet = createPet('ENFP', '코코', T0);
    const abandoned = projectGauges(pet, BREEDS.ENFP.traits, T0 + 1000 * HOUR);
    expect(abandoned).toEqual({ satiety: 0, affection: 0, vitality: 0 });
  });

  it('시계가 뒤로 가도 게이지가 회복되지 않는다', () => {
    const pet = createPet('ENFP', '코코', T0);
    expect(projectGauges(pet, BREEDS.ENFP.traits, T0 - 10 * HOUR)).toEqual(pet.gauges);
  });

  it('같은 입력이면 항상 같은 값이 나온다 — 서버 재검증의 전제', () => {
    const pet = createPet('INFJ', '보리', T0);
    const at = T0 + 5 * HOUR;
    expect(projectGauges(pet, BREEDS.INFJ.traits, at)).toEqual(
      projectGauges(pet, BREEDS.INFJ.traits, at),
    );
  });
});

describe('gaugeStatus', () => {
  it('구간별 상태를 돌려준다', () => {
    expect(gaugeStatus(5)).toBe('critical');
    expect(gaugeStatus(25)).toBe('warning');
    expect(gaugeStatus(80)).toBe('normal');
  });
});
