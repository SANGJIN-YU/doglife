import type { Breed, MbtiCode } from './types';

/**
 * MBTI 16유형 ↔ 16견종 1:1 매핑.
 * 견종명·설명·특성치는 prototype/mbti-dog-match.html의 BREED_MATCH를 그대로 옮긴 것이다.
 *
 * 이 매칭은 재미로 보는 콘텐츠이며 과학적 근거를 주장하지 않는다.
 */
export const BREEDS: Record<MbtiCode, Breed> = {
  ENFP: {
    id: 'golden-retriever',
    name: '골든 리트리버',
    emoji: '🐕‍🦺',
    description: '낯선 사람도 금세 친구로 만드는 밝은 에너지. 당신처럼 사람과 새로운 경험을 좋아해요.',
    traits: { energy: 75, independence: 30, affection: 90, trainability: 80 },
  },
  ENFJ: {
    id: 'labrador-retriever',
    name: '래브라도 리트리버',
    emoji: '🦮',
    description: '주변 사람을 잘 챙기고 온화한 성격. 당신처럼 무리를 편안하게 이끄는 타입이에요.',
    traits: { energy: 80, independence: 25, affection: 85, trainability: 90 },
  },
  ENTP: {
    id: 'jack-russell-terrier',
    name: '잭 러셀 테리어',
    emoji: '🐩',
    description: '끊임없는 호기심과 장난기. 당신처럼 아이디어가 넘치고 가만히 있질 못해요.',
    traits: { energy: 90, independence: 60, affection: 55, trainability: 50 },
  },
  ENTJ: {
    id: 'doberman-pinscher',
    name: '도베르만 핀셔',
    emoji: '🐕',
    description: '카리스마 있고 목표지향적. 당신처럼 상황을 주도하는 리더 기질이 있어요.',
    traits: { energy: 70, independence: 55, affection: 60, trainability: 85 },
  },
  ESFP: {
    id: 'beagle',
    name: '비글',
    emoji: '🐶',
    description: '즉흥적이고 사교적인 분위기 메이커. 당신처럼 그 순간을 마음껏 즐겨요.',
    traits: { energy: 80, independence: 50, affection: 70, trainability: 45 },
  },
  ESFJ: {
    id: 'cocker-spaniel',
    name: '코카 스파니엘',
    emoji: '🐕',
    description: '다정하고 배려심 많은 성격. 당신처럼 주변 사람을 세심하게 챙겨요.',
    traits: { energy: 55, independence: 20, affection: 90, trainability: 75 },
  },
  ESTP: {
    id: 'dalmatian',
    name: '달마시안',
    emoji: '🐆',
    description: '대담하고 활동적인 행동파. 당신처럼 몸으로 부딪히며 배우는 걸 좋아해요.',
    traits: { energy: 95, independence: 60, affection: 55, trainability: 55 },
  },
  ESTJ: {
    id: 'german-shepherd',
    name: '저먼 셰퍼드',
    emoji: '🐕‍🦺',
    description: '책임감 있고 규율을 잘 따르는 성격. 당신처럼 체계적으로 일을 해내요.',
    traits: { energy: 75, independence: 45, affection: 65, trainability: 95 },
  },
  INFP: {
    id: 'shiba-inu',
    name: '시바견',
    emoji: '🦊',
    description: '겉은 무심해 보여도 속은 섬세한 타입. 당신처럼 자기만의 세계가 뚜렷해요.',
    traits: { energy: 55, independence: 85, affection: 50, trainability: 40 },
  },
  INFJ: {
    id: 'border-collie',
    name: '보더 콜리',
    emoji: '🐕',
    description: '관찰력이 뛰어나고 통찰력 있는 성격. 당신처럼 깊이 생각하고 신중하게 행동해요.',
    traits: { energy: 85, independence: 40, affection: 65, trainability: 95 },
  },
  INTP: {
    id: 'chow-chow',
    name: '차우차우',
    emoji: '🦁',
    description: '독립적이고 자기 페이스를 지키는 타입. 당신처럼 남의 기준에 휘둘리지 않아요.',
    traits: { energy: 35, independence: 90, affection: 40, trainability: 35 },
  },
  INTJ: {
    id: 'standard-poodle',
    name: '스탠다드 푸들',
    emoji: '🐩',
    description: '똑똑하고 전략적인 문제 해결형. 당신처럼 효율적인 방법을 스스로 찾아내요.',
    traits: { energy: 65, independence: 60, affection: 60, trainability: 90 },
  },
  ISFP: {
    id: 'french-bulldog',
    name: '프렌치 불도그',
    emoji: '🐶',
    description: '느긋하고 감성적인 성격. 당신처럼 편안한 분위기 속에서 진가를 발휘해요.',
    traits: { energy: 30, independence: 40, affection: 80, trainability: 55 },
  },
  ISFJ: {
    id: 'cavalier-king-charles-spaniel',
    name: '카발리에 킹 찰스 스패니얼',
    emoji: '🐕',
    description: '다정하고 헌신적인 성격. 당신처럼 가까운 사람을 조용히 챙겨요.',
    traits: { energy: 45, independence: 15, affection: 95, trainability: 70 },
  },
  ISTJ: {
    id: 'great-pyrenees',
    name: '그레이트 피레니즈',
    emoji: '🐻',
    description: '듬직하고 신뢰할 수 있는 성격. 당신처럼 맡은 일을 묵묵히 지켜내요.',
    traits: { energy: 40, independence: 60, affection: 60, trainability: 65 },
  },
  ISTP: {
    id: 'whippet',
    name: '휘핏',
    emoji: '🐕',
    description: '평소엔 조용하지만 필요할 땐 확실하게 움직이는 타입. 당신처럼 군더더기가 없어요.',
    traits: { energy: 60, independence: 75, affection: 45, trainability: 50 },
  },
};

const BREEDS_BY_ID: ReadonlyMap<string, Breed> = new Map(
  Object.values(BREEDS).map((breed) => [breed.id, breed]),
);

export function breedForMbti(mbti: MbtiCode): Breed {
  return BREEDS[mbti];
}

/** 저장된 breedId를 견종으로 되돌린다. 알 수 없는 id는 null. */
export function breedById(id: string): Breed | null {
  return BREEDS_BY_ID.get(id) ?? null;
}

export const TRAIT_LABELS: Record<keyof Breed['traits'], string> = {
  energy: '에너지',
  independence: '독립성',
  affection: '애정도',
  trainability: '훈련성',
};
