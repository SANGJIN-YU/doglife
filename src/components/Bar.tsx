import type { GaugeStatus } from '../domain/stats';

interface BarProps {
  label: string;
  /** 0~100 */
  value: number;
  /** 오른쪽에 표시할 텍스트. 없으면 반올림한 값 */
  valueText?: string;
  status?: GaugeStatus;
  /** 채움 막대에 덧붙일 클래스 */
  fillClassName?: string;
}

export function Bar({ label, value, valueText, status, fillClassName }: BarProps) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="bar-row">
      <div className="bar-labels">
        <span>{label}</span>
        <span>{valueText ?? Math.round(value)}</span>
      </div>
      <div
        className="bar-track"
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={fillClassName ? `bar-fill ${fillClassName}` : 'bar-fill'}
          style={{ width: `${width}%` }}
          {...(status ? { 'data-status': status } : {})}
        />
      </div>
    </div>
  );
}
