import { useState } from 'react';
import { MBTI_CODES } from '../domain/types';
import type { MbtiCode } from '../domain/types';

interface MbtiSelectScreenProps {
  onSelect: (mbti: MbtiCode) => void;
}

export function MbtiSelectScreen({ onSelect }: MbtiSelectScreenProps) {
  const [picked, setPicked] = useState<MbtiCode | null>(null);

  return (
    <div className="screen select">
      <h2>당신의 MBTI는?</h2>
      <p className="sub">모르신다면 평소 성향에 가장 가까운 걸 골라주세요.</p>

      <div className="mbti-grid">
        {MBTI_CODES.map((code) => (
          <button
            key={code}
            type="button"
            className="mbti-btn"
            aria-pressed={picked === code}
            onClick={() => setPicked(code)}
          >
            {code}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={picked === null}
        onClick={() => picked && onSelect(picked)}
      >
        매칭 결과 보기
      </button>
      <div className="select-footer">16개 유형 중 하나를 선택하세요</div>
    </div>
  );
}
