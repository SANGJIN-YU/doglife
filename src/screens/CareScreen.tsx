import { useEffect, useState } from 'react';
import { Bar } from '../components/Bar';
import { CARE_ACTIONS, CARE_ACTION_ORDER } from '../domain/balance';
import { cooldownRemaining, resolveBreed } from '../domain/game';
import { growthProgress } from '../domain/growth';
import { moodMessage, moodTone } from '../domain/mood';
import { GAUGE_KEYS, GAUGE_LABELS, gaugeStatus, projectGauges } from '../domain/stats';
import { formatCooldown, formatTogether } from '../utils/time';
import type { CareActionResult } from '../domain/game';
import type { CareActionKey, Pet } from '../domain/types';

interface CareScreenProps {
  pet: Pet;
  coins: number;
  now: number;
  onCare: (action: CareActionKey) => CareActionResult;
  onReset: () => void;
}

interface Feedback {
  tone: 'info' | 'error';
  text: string;
  /** 같은 메시지를 연속으로 띄워도 타이머가 다시 돌도록 하는 키 */
  key: number;
}

const FEEDBACK_DURATION_MS = 3200;

export function CareScreen({ pet, coins, now, onCare, onReset }: CareScreenProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const breed = resolveBreed(pet);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [feedback]);

  if (!breed) {
    // 저장된 견종을 알아볼 수 없는 경우. 파싱 단계에서 걸러지므로 방어적 분기다.
    return (
      <div className="screen care">
        <p className="pet-mood">저장된 강아지 정보를 읽을 수 없어요.</p>
        <button type="button" className="btn-primary" onClick={onReset}>
          처음부터 다시 시작
        </button>
      </div>
    );
  }

  const gauges = projectGauges(pet, breed.traits, now);
  const growth = growthProgress(pet.carePoints);
  const tone = moodTone(gauges);

  function handleCare(action: CareActionKey) {
    const result = onCare(action);
    if (result.ok) {
      const grew = result.outcome.grew;
      setFeedback({
        tone: 'info',
        key: Date.now(),
        text: grew
          ? `${CARE_ACTIONS[action].label} 완료! ${result.outcome.stage.label}(으)로 성장했어요 🎉`
          : `${CARE_ACTIONS[action].label} 완료! 간식 코인 +${result.outcome.coins}`,
      });
      return;
    }
    setFeedback({
      tone: 'error',
      key: Date.now(),
      text:
        result.reason === 'cooldown'
          ? `아직 쉬는 중이에요. ${formatCooldown(result.retryAfterMs)} 후에 다시 해주세요.`
          : '지금은 할 수 없어요.',
    });
  }

  return (
    <div className="screen care">
      <div className="care-top">
        <span className="stage-badge">{growth.current.label}</span>
        <span className="coin-badge">🦴 {coins}</span>
      </div>

      <div className="pet-display">
        <div
          className="pet-emoji"
          data-mood={tone === 'sad' ? 'sad' : undefined}
          style={{ transform: `scale(${growth.current.scale})` }}
          aria-hidden="true"
        >
          {breed.emoji}
        </div>
        <h2 className="pet-name">{pet.name}</h2>
        <p className="pet-breed">
          {breed.name} · {pet.mbti} · {formatTogether(Math.max(0, now - pet.bornAt))}
        </p>
        <p className="pet-mood">{moodMessage(pet.name, gauges)}</p>
      </div>

      <div className="growth-card">
        <div className="growth-labels">
          <span>성장</span>
          <span>
            {growth.next
              ? `${growth.next.label}까지 ${growth.remainingCarePoints}회`
              : '마지막 단계에 도달했어요'}
          </span>
        </div>
        <div
          className="bar-track"
          role="meter"
          aria-label="성장 진행도"
          aria-valuenow={Math.round(growth.ratio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar-fill growth-fill" style={{ width: `${growth.ratio * 100}%` }} />
        </div>
      </div>

      <div className="card">
        <h3>오늘의 상태</h3>
        {GAUGE_KEYS.map((key) => (
          <Bar key={key} label={GAUGE_LABELS[key]} value={gauges[key]} status={gaugeStatus(gauges[key])} />
        ))}
      </div>

      <div className="actions">
        {CARE_ACTION_ORDER.map((key) => {
          const spec = CARE_ACTIONS[key];
          const remaining = cooldownRemaining(pet, key, now);
          return (
            <button
              key={key}
              type="button"
              className="action-btn"
              disabled={remaining > 0}
              onClick={() => handleCare(key)}
              title={spec.hint}
            >
              <span className="action-emoji" aria-hidden="true">
                {spec.emoji}
              </span>
              <span className="action-label">{spec.label}</span>
              <span className="action-meta">{remaining > 0 ? formatCooldown(remaining) : `+${spec.coins}🦴`}</span>
            </button>
          );
        })}
      </div>

      <div className="care-footer">
        <div aria-live="polite">
          {feedback && (
            <div className="toast" data-tone={feedback.tone === 'error' ? 'error' : undefined}>
              {feedback.text}
            </div>
          )}
        </div>
        <button type="button" className="link-button" onClick={onReset}>
          다른 유형으로 다시 시작
        </button>
      </div>
    </div>
  );
}
