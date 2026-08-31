interface IntroScreenProps {
  onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="screen intro">
      <div>
        <div className="eyebrow">MBTI × DOG MATCHING</div>
        <h1>
          나와 닮은
          <br />
          강아지 찾기
        </h1>
        <p>당신의 MBTI와 꼭 닮은 성격의 강아지 종을 찾아드려요. 그 강아지를 직접 키우는 것도 가능해요.</p>
      </div>
      <button type="button" className="btn-primary" onClick={onStart}>
        내 MBTI로 찾기
      </button>
    </div>
  );
}
