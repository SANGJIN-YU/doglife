import { useState } from 'react';
import { CareScreen } from './screens/CareScreen';
import { IntroScreen } from './screens/IntroScreen';
import { MbtiSelectScreen } from './screens/MbtiSelectScreen';
import { RevealScreen } from './screens/RevealScreen';
import { useGame } from './hooks/useGame';
import { useNow } from './hooks/useNow';
import type { MbtiCode } from './domain/types';

/** 강아지가 없을 때의 온보딩 단계. 강아지가 생기면 케어 화면으로 넘어간다. */
type Onboarding = { name: 'intro' } | { name: 'select' } | { name: 'reveal'; mbti: MbtiCode };

export function App() {
  const { loaded, state, startRaising, care, reset } = useGame();
  const [onboarding, setOnboarding] = useState<Onboarding>({ name: 'intro' });
  const now = useNow();

  if (!loaded) {
    return (
      <div className="stage">
        <div className="screen loading">불러오는 중…</div>
      </div>
    );
  }

  function handleReset() {
    reset();
    setOnboarding({ name: 'intro' });
  }

  return (
    <div className="stage">
      {state.pet ? (
        <CareScreen pet={state.pet} coins={state.coins} now={now} onCare={care} onReset={handleReset} />
      ) : onboarding.name === 'intro' ? (
        <IntroScreen onStart={() => setOnboarding({ name: 'select' })} />
      ) : onboarding.name === 'select' ? (
        <MbtiSelectScreen onSelect={(mbti) => setOnboarding({ name: 'reveal', mbti })} />
      ) : (
        <RevealScreen
          mbti={onboarding.mbti}
          onStartRaising={(name) => startRaising(onboarding.mbti, name)}
          onBack={() => setOnboarding({ name: 'select' })}
        />
      )}
    </div>
  );
}
