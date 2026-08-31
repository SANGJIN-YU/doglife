import { useState } from 'react';
import { Bar } from '../components/Bar';
import { TRAIT_LABELS, breedForMbti } from '../domain/breeds';
import type { BreedTraits, MbtiCode } from '../domain/types';

interface RevealScreenProps {
  mbti: MbtiCode;
  onStartRaising: (name: string) => void;
  onBack: () => void;
}

const TRAIT_ORDER: readonly (keyof BreedTraits)[] = ['energy', 'independence', 'affection', 'trainability'];

export function RevealScreen({ mbti, onStartRaising, onBack }: RevealScreenProps) {
  const breed = breedForMbti(mbti);
  const [name, setName] = useState('');

  return (
    <div className="screen reveal">
      <div className="reveal-label">{mbti} 매칭 결과</div>
      <div className="reveal-emoji" aria-hidden="true">
        {breed.emoji}
      </div>
      <h2 className="reveal-breed">{breed.name}</h2>
      <p className="reveal-mbti">{mbti} 유형과 매칭</p>
      <p className="reveal-desc">{breed.description}</p>

      <div className="card">
        <h3>이 견종의 특성</h3>
        {TRAIT_ORDER.map((trait) => (
          <Bar key={trait} label={TRAIT_LABELS[trait]} value={breed.traits[trait]} />
        ))}
      </div>

      <div className="cta-card">
        <p>
          이제 {breed.name}를 직접 키워보세요. 이 특성치가 그대로 시작 스탯이 되고, 매일 밥을 주고 산책하며 성장
          과정을 지켜볼 수 있어요.
        </p>
        <input
          className="name-input"
          type="text"
          value={name}
          maxLength={12}
          placeholder="이름을 지어주세요"
          aria-label="강아지 이름"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => onStartRaising(name)}>
          이 강아지 키우기 시작
        </button>
      </div>

      <button type="button" className="link-button" onClick={onBack}>
        다른 유형으로 다시 찾기
      </button>
    </div>
  );
}
