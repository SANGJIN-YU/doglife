import { useEffect, useState } from 'react';

/**
 * 주기적으로 갱신되는 현재 시각.
 * 게이지는 이 값과 스냅샷으로 매 렌더에서 다시 계산되므로,
 * 화면을 오래 열어두거나 탭을 복귀시켜도 값이 어긋나지 않는다.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
