# 아키텍처 — Phase B를 염두에 둔 Phase A 구현

Phase A(온보딩 + 코어 케어 루프)를 서버 없이 만들되, Phase B(경제 + 수집)에서 Supabase를
도입할 때 UI와 게임 규칙을 다시 쓰지 않아도 되도록 잡은 구조를 설명한다.

스펙(`game-expansion-spec.md`)이 지적한 대로 재화·수집은 클라이언트에만 두면 조작이 바로
발생한다. 그래서 Phase A에서 이미 **"나중에 서버가 판정할 로직"을 물리적으로 분리해** 둔다.

## 1. 설계 원칙 세 가지

### 원칙 1 — 도메인 계층은 순수하게 유지한다

`src/domain/`의 모든 모듈은 `window`, `localStorage`, `Date.now()`, 난수를 참조하지 않는다.
현재 시각은 항상 **인자로 받는다**.

```ts
applyCareAction(state, action, now) // now를 주입 — 내부에서 시계를 읽지 않는다
```

이 제약 덕분에 같은 모듈을 Supabase Edge Function(Deno)에서 그대로 import 해
클라이언트가 보낸 결과를 재계산할 수 있다. Phase B에서 서버는 **클라이언트가 보낸 시각을
무시하고 자기 시계를 넣어** 같은 함수를 돌린다. 게임 규칙이 두 벌로 갈라지지 않는 게 핵심이다.

### 원칙 2 — 게이지는 누적하지 않고 유도한다

게이지를 틱마다 깎아 저장하면 그 값은 클라이언트가 만들어낸 것이라 서버가 검증할 수 없다.
대신 **스냅샷과 그 시각만 저장하고, 현재 값은 경과 시간에서 계산한다.**

```
pet.gauges    = { satiety: 80, affection: 95, vitality: 45 }  // 스냅샷
pet.gaugesAt  = 1700000000000                                  // 그 시점
현재 값       = projectGauges(pet, traits, now)                // 순수 함수
```

같은 `(pet, now)`면 브라우저든 서버든 같은 값이 나온다. 탭을 오래 열어두거나, 백그라운드로
보냈다가 돌아오거나, 앱을 며칠 뒤에 켜도 값이 어긋나지 않는다 — 계산식이 하나뿐이기 때문이다.

쿨다운도 같은 이유로 남은 시간을 저장하지 않고 `lastActionAt` 타임스탬프만 저장한다.

### 원칙 3 — 저장소는 인터페이스 뒤에 둔다

```ts
interface GameRepository {
  load(): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}
```

Phase A의 구현은 `LocalGameRepository`(localStorage) 하나뿐이지만 **지금부터 비동기**다.
동기 인터페이스로 만들어두면 Phase B에서 네트워크 호출로 바뀌는 순간 모든 호출부가
async로 전염되기 때문이다. 교체 지점은 `src/data/index.ts` 한 줄이다.

## 2. 계층 구조

```
src/domain/     게임 규칙. 순수 TS. 브라우저 API 없음. → Phase B에서 서버와 공유
src/data/       저장·복원·검증. 저장소 구현 교체 지점
src/hooks/      도메인 결과를 React 상태로 배선
src/screens/    화면. 규칙을 담지 않는다
src/components/ 표시 전용 컴포넌트
```

의존 방향은 위에서 아래로만 흐른다. `domain/`은 어떤 상위 계층도 import 하지 않는다.

## 3. 게임 규칙 요약

### 견종 특성 → 게임 내 역할

스펙의 매핑을 그대로 구현했다. 특성치는 변하지 않는 영구 스탯이고, 게이지는 시간에 따라
변하는 값이다.

| 특성 | 구현된 역할 | 위치 |
|---|---|---|
| 에너지 | 활력 게이지 감소 속도(↑), 산책 회복량 보너스 | `balance.ts` `DECAY_MODIFIER.vitality` |
| 독립성 | 애정 게이지 감소 속도(↓) | `balance.ts` `DECAY_MODIFIER.affection` |
| 애정도 | 쓰다듬기 시 애정 획득량 | `CARE_ACTIONS.pet.traitBonus` |
| 훈련성 | 훈련 미니게임 성공률 — **Phase A 미사용**, 값만 보관 | `types.ts` |

초기 게이지는 매칭된 견종의 특성치를 그대로 쓴다(애정 ← 애정도, 활력 ← 에너지). 허기는
대응되는 특성이 없어 고정값에서 시작한다. 결과적으로 16견종이 16개의 서로 다른 시작 빌드가 된다.

### 용어에서 스펙과 다르게 간 곳

- 스펙의 **허기**는 UI에서 **포만감**으로 표시한다. 게이지가 높을수록 배부른 상태인데
  "허기 80"은 뜻이 거꾸로 읽히기 때문이다. 내부 키는 `satiety`.
- 스펙의 **에너지**는 게이지 이름으로는 **활력**을 쓴다. 견종 특성 "에너지"와 이름이 겹치면
  "에너지가 높은 개는 에너지가 빨리 닳는다"는 문장이 되어 버린다. 내부 키는 `vitality`.

### 밸런스

수치는 전부 `src/domain/balance.ts` 한 곳에 있다. 스펙이 말한 대로 유형별 유불리는 의도된
것이고, 조정은 알파 단계에서 이 파일만 고치면 된다. 쿨다운은 한 세션 안에서 루프를 여러 번
돌려볼 수 있도록 실제 방치형 게임보다 짧게 잡은 알파 기준값이다.

## 4. Phase B에서 무엇이 바뀌는가

### 서버 권위로 옮겨야 하는 것

| 대상 | Phase A | Phase B |
|---|---|---|
| 케어 행동 판정 | 클라이언트에서 `applyCareAction` | Edge Function이 **같은 함수**를 서버 시계로 재실행 |
| 코인 지급·차감 | 클라이언트 상태 | 서버가 지갑 테이블에 기록, 클라이언트는 요청만 |
| 원장 | localStorage 배열(최근 200건) | append-only 테이블, 서버만 write |
| 쿨다운 | 클라이언트 타임스탬프 | 서버 저장 타임스탬프가 진실 |
| 상점·수집 | 없음 | 전부 서버 검증 |

**클라이언트가 보낸 시각은 절대 신뢰하지 않는다.** 도메인 함수가 `now`를 인자로 받는 구조라
서버는 요청 본문의 시각을 버리고 자기 시계를 넣기만 하면 된다.

### 스키마 초안

```sql
create table players (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table pets (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid not null references players(id) on delete cascade,
  mbti             text not null,
  breed_id         text not null,
  name             text not null,
  born_at          timestamptz not null,
  -- 게이지 스냅샷과 그 시점. 현재 값은 읽는 쪽에서 유도한다.
  gauge_satiety    numeric not null,
  gauge_affection  numeric not null,
  gauge_vitality   numeric not null,
  gauges_at        timestamptz not null,
  care_points      integer not null default 0,
  last_feed_at     timestamptz,
  last_walk_at     timestamptz,
  last_pet_at      timestamptz
);

-- append-only. 클라이언트는 select만, insert는 서버 역할로만.
create table care_events (
  id           bigserial primary key,
  pet_id       uuid not null references pets(id) on delete cascade,
  action       text not null check (action in ('feed', 'walk', 'pet')),
  performed_at timestamptz not null default now(),
  coin_delta   integer not null
);

create table wallets (
  player_id uuid primary key references players(id) on delete cascade,
  coins     integer not null default 0 check (coins >= 0)
);
```

RLS는 "자기 행만 select" 로 열고, `wallets`와 `care_events`에는 클라이언트 write 정책을
만들지 않는다. 쓰기는 service role을 가진 Edge Function만 한다.

### Edge Function `care`의 흐름

```
1. 요청 { petId, action } 수신 — 요청에 담긴 시각은 버린다
2. 인증된 player의 pet인지 확인
3. DB 행 → GameState 로 변환
4. applyCareAction(state, action, Date.now())  ← 클라이언트와 같은 함수
5. 실패(쿨다운 등)면 그대로 거절
6. 성공이면 pets / care_events / wallets 를 한 트랜잭션으로 갱신
7. 새 상태를 응답 — 클라이언트는 이 값으로 덮어쓴다
```

클라이언트는 낙관적으로 먼저 반영하고 응답으로 교정하면 된다. 규칙이 한 벌이라 낙관적 결과와
서버 결과가 갈라지는 경우는 시계 오차뿐이다.

### 이때 필요한 코드 변경

1. `src/domain/`을 클라이언트와 Edge Function이 함께 쓰는 위치로 옮긴다(워크스페이스 패키지).
2. `SupabaseGameRepository`를 추가하고 `src/data/index.ts`의 한 줄을 바꾼다.
3. `useGame`의 `care`를 Edge Function 호출로 바꾼다. 화면 코드는 그대로다.

## 5. 남아 있는 치팅 표면 (Phase A 한정)

Phase A는 로컬 저장이므로 localStorage를 직접 고치면 코인과 게이지를 조작할 수 있다.
**의도된 것이다** — 이 단계에는 지킬 자산이 없다. 다만 깨진 값이 앱을 죽이지는 않도록
`src/data/serialization.ts`에서 저장된 값을 전부 검증한다.

- 알 수 없는 견종 → 강아지를 버린다
- 범위를 벗어난 게이지 → 0~100으로 자른다
- 음수 코인 → 0
- 형태가 깨진 원장 항목 → 해당 항목만 제거
- 저장 포맷 버전 불일치 → 전체를 버리고 새로 시작

Phase B에서 서버가 진실의 원천이 되면 이 계층은 "신뢰할 수 없는 캐시를 파싱하는 곳"으로
역할이 그대로 이어진다.

## 6. 테스트

도메인과 직렬화 계층에 단위 테스트가 있다(`npm test`). 특히 다음을 고정해 두었다.

- 같은 입력이면 항상 같은 결과가 나온다 — 서버 재검증의 전제
- 입력 상태를 변경하지 않는다
- 기기 시계가 뒤로 가도 게이지가 회복되거나 쿨다운이 영구히 잠기지 않는다
- 코인 합계가 원장 합계와 일치한다
- 조작된 저장값이 범위 안으로 교정된다

UI에는 아직 테스트가 없다. Phase B에서 서버 연동이 들어가면 그때 통합 테스트를 붙이는 게 맞다.
