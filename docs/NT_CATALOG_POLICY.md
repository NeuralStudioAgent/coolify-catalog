# Next-Tomorrow (NT) 카탈로그 정책

이 문서는 Coolify 배포 목록과 Next-Tomorrow(NT) 데모 목록을 **분리 관리**하는 규칙을 정의한다.  
앞으로 배포·등록·문서화 시 이 정책을 따른다.

---

## 1. 두 목록의 역할

| 목록 | URL | 대상 |
|------|-----|------|
| **일반 Deploy Catalog** | https://demo.app.genver.online/ | teamver / genver 등 일반·데모 배포 |
| **Next-Tomorrow Demo List** | https://demo.app.next-tomorrow.online/ | NT(next-tomorrow) 고객/회사용 데모만 |

NT 목록은 NT 회사 사업이므로 **회사 도메인(`next-tomorrow.online`)에서 서비스한다.**
구 주소 `nt-demos.app.genver.online` 은 301 리다이렉트로만 남긴다.

- NT 항목은 **일반 목록에 표시하지 않는다.**
- NT 목록은 **일본어(JP) 기본**, 한국어(KR)는 토글 옵션 (pmnt와 동일 패턴).
- 페이지 제목: **Next-Tomorrow Demo List**

---

## 2. NT로 분류하는 기준

다음 중 하나라도 해당하면 NT로 관리한다.

1. **`next-tomorrow.online` 도메인으로 배포된 것은 전부 NT다.** 판단이 필요 없다.
2. Next-Tomorrow(NT) 회사용으로 배포·시연하는 앱
3. Green AI / CAT.AI 등 NT 맥락의 데모·프로토
4. NT 전용 도구로 쓰는 보드 (예: 프로젝트 관리 `pmnt`)

애매하면 **NT로 넣고**, 일반 목록에는 올리지 않는다.

> 기준 1이 가장 자주 쓰인다. 앞으로 NT 앱은 `*.next-tomorrow.online` 에 배포하고,
> 배포 직후 `nt-apps.json` 에 등록한다. 등록하지 않으면 Coolify DB 조회를 통해
> **일반 목록에 그대로 노출된다** (실제로 `greenai-rag` 이 그렇게 새어 나갔다).

---

## 3. 현재 NT 등록 목록

설정 파일: [`nt-apps.json`](../nt-apps.json)

| key | 구분 (`kind`) | URL (대표 — 목록 노출) | 구 URL (계속 동작, 목록 비노출) |
|-----|----------------|------------------------|----------------------------------|
| `nti-demo` | mockup | https://nti-demo.app.next-tomorrow.online | https://nti-demo.app.genver.online |
| `farm-support` | mockup | https://farm-support.app.next-tomorrow.online | https://farm-support.app.teamver.online |
| `open-inno` | mockup | https://open-inno.app.next-tomorrow.online | https://open-inno.app.teamver.online |
| `open-inno-catai` | mockup | https://open-inno-catai.app.next-tomorrow.online | https://open-inno-catai.app.teamver.online |
| `greenai-proto` | **proto** | https://greenai-proto.app.next-tomorrow.online | https://greenai-proto.app.genver.online |
| `greenai-rag` | **proto** | https://rag.demo.next-tomorrow.online | *(없음)* |
| `pmnt` | *(없음 — 도구)* | https://pmnt.app.next-tomorrow.online | https://pmnt.app.genver.online |
| `rag-exp` | *(없음 — `listed: false`)* | https://rag-exp.app.next-tomorrow.online | *(없음)* |
| `idex-catai` | **proto** (`listed: false`) | https://idex-catai.proto.next-tomorrow.online | *(없음)* |
| `idex-nt` | **proto** (`listed: false`) | https://idex-nt.proto.next-tomorrow.online | *(없음)* |

목록이 바뀌면 **반드시 `nt-apps.json`과 이 표를 함께 갱신**한다.

### 3.2 목록 비노출 예외 (`listed: false`)

특정 수신자에게만 보내는 비공개 자료는 **두 목록 어디에도 싣지 않는다.**

`nt-apps.json` 항목에 `"listed": false` 를 넣으면 NT 목록에서 제외된다.
정의 자체는 **반드시 남겨야** 한다 — `isNtApp` 매칭이 있어야 일반 목록으로 새어 나가지 않는다.
정의를 아예 빼면 Coolify DB 조회로 **일반 목록에 그대로 노출된다.**

| 설정 | 일반 목록 | NT 목록 |
|---|---|---|
| 정의 없음 | **노출됨** ← 유출 | 없음 |
| 정의 있음 (기본) | 제외 | 노출 |
| 정의 있음 + `listed: false` | 제외 | 제외 |

현재 대상:

- `rag-exp` (일본 고객 발송용 RAG 기술자료 3종)
- `idex-catai` / `idex-nt` (이데쿠스덴키 제안용 PoC 2종 — 특정 고객 대상이라 목록 비노출)

### 3.1 주소 규칙

- NT 앱의 대표 주소는 **`<앱>.app.next-tomorrow.online`** 이다.
- 구 주소(genver / teamver)는 **리다이렉트하지 않고 그대로 서비스한다.** 기존 링크·자료가
  깨지지 않게 하려는 것이고, 리다이렉트로 처리하면 주소창에 타사 도메인이 드러나
  회사 도메인으로 옮긴 의미가 없어진다.
- **목록에는 `next-tomorrow.online` 주소만 노출된다** (`server.js`의 `ntPublicUrls`).
  구 주소는 카탈로그에 표시되지 않을 뿐, 접속은 계속 된다.
- NT 주소가 아직 없는 항목은 예외적으로 가진 주소를 그대로 보여준다 (링크 없는 카드 방지).

---

## 4. demo (mockup) vs demo (proto)

NT 목록에서는 데모 성격을 구분해서 표시한다.

| `kind` | UI 라벨 | 의미 | 적용 |
|--------|---------|------|------|
| `"mockup"` | **demo (mockup)** | 화면·플로우 시연용 목업 | 기본값. NT 데모는 대부분 여기 |
| `"proto"` | **demo (proto)** | 동작하는 프로토타입 | 현재는 **Green AI Proto (CAT.AI)** 만 |
| `null` / 생략 | 구분 배지 없음 | 데모가 아닌 운영/도구성 앱 | **Project Management (`pmnt`)** |

### 규칙

- 새 NT 데모는 특별히 proto가 아니면 **`kind: "mockup"`**.
- 실제 연동·백엔드가 있는 프로토타입만 **`kind: "proto"`**.
- 프로젝트 관리처럼 “데모 제품”이 아닌 도구는 **`kind`를 넣지 않거나 `null`**.

---

## 5. 새 앱 등록 절차

### 5.1 NT 앱인 경우

1. Coolify(또는 수동 배포)로 배포한다.
2. 대표 주소 `<앱>.app.next-tomorrow.online` 를 붙인다.
   - Porkbun에 A 레코드 추가 (→ `72.62.240.155`). `*.next-tomorrow.online` 와일드카드는
     파킹으로 잡혀 있으므로 **서브도메인마다 개별 레코드가 필요**하다.
   - Coolify 앱: `domains` 에 기존 주소와 함께 콤마로 넣고 restart (라벨이 재생성된다).
   - 수동 배포: compose 라벨 rule을 `Host(구) || Host(신)` 으로 확장 후 `up -d`.
3. [`nt-apps.json`](../nt-apps.json)에 항목을 추가한다.
   - `key`, `matchNames`, `matchHosts`, `urls` — **`matchHosts`·`urls` 에 신·구 주소를 모두** 넣는다
     (구 주소로 배포된 앱이 일반 목록으로 새어 나가지 않게 한다)
   - `title` / `description` — **jp · kr 둘 다**
   - `kind`: `"mockup"` | `"proto"` | `null`
3. 일반 목록용 [`extras.json`](../extras.json)에는 **넣지 않는다** (중복·유출 방지).
4. 이 문서 **§3 표**를 업데이트한다.
5. 배포: `/opt/coolify-catalog` 동기화 후 `docker compose up -d --build`.
6. 확인:
   - NT: https://demo.app.next-tomorrow.online/ 에 보이는지
   - 일반: https://demo.app.genver.online/ 에 **안** 보이는지

### 5.2 일반(비 NT) 앱인 경우

1. Coolify에 배포하면 DB 조회로 일반 목록에 자동 반영된다.
2. 수동 배포만 해당하면 [`extras.json`](../extras.json)에 추가한다.
3. **`nt-apps.json`에는 넣지 않는다.**

### 5.3 소속에서 빠지거나 NT로 바뀌는 경우

- 일반 → NT: `nt-apps.json`에 추가 (match로 일반 목록에서 자동 제외).
- NT → 일반: `nt-apps.json`에서 제거하고, 필요 시 Coolify/extras만 유지.

---

## 6. 구현·파일 위치

| 파일 | 역할 |
|------|------|
| `nt-apps.json` | NT 전용 정의 (매칭·i18n·kind) |
| `extras.json` | 일반 목록용 수동 항목 (+ NT 목록 링크) |
| `server.js` | Coolify DB 조회, NT 필터, `/api/apps` · `/api/nt-apps` |
| — `ntPublicUrls` | NT 목록에 회사 도메인 주소만 노출 (구 주소는 숨김, 서비스는 유지) |
| — `NT_HOSTS` | NT UI를 서비스할 호스트(쉼표 구분). `*.next-tomorrow.online` 은 설정 없이도 NT로 취급 |
| `public/` | 일반 카탈로그 UI |
| `public/nt/` | NT Demo List UI (JP/KR) |
| `docker-compose.yml` | Host: `demo.app.genver.online`, `demo.app.next-tomorrow.online`<br>(구 `coolify.app.genver.online`·`nt-demos.app.genver.online` → 301) |

서버 경로: `/opt/coolify-catalog`  
저장소: https://github.com/NeuralStudioAgent/coolify-catalog

---

## 7. 언어·UX 정책 (NT 목록)

- 기본 언어: **일본어 (JP)**
- 옵션: **한국어 (KR)** 세그먼트 토글
- 선택값은 `localStorage` (`nt_demo_lang`)에 유지
- 제목 브랜드 문구 **Next-Tomorrow Demo List** 는 언어와 관계없이 유지 가능 (제품명)

---

## 8. 체크리스트 (배포 전)

- [ ] NT 여부 판단 완료
- [ ] NT면 `nt-apps.json` 갱신, 일반 목록에 안 남는지 확인
- [ ] `kind` (mockup / proto / null) 올바름
- [ ] jp / kr 설명 작성
- [ ] DNS·Traefik Host가 필요하면 설정
- [ ] 이 정책 문서 §3 동기화

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-28 | 정책 문서 최초 작성. NT 6종 분리, mockup/proto 구분 도입 |
| 2026-07-29 | 일반 카탈로그 도메인을 `demo.app.genver.online`으로 이전 (구 주소는 301) |
| 2026-07-29 | NT 목록을 회사 도메인 `demo.app.next-tomorrow.online` 으로 이전 (`nt-demos.app` → 301). `next-tomorrow.online` 배포는 전부 NT로 분류 (§2-1). `greenai-rag` 등록 |
| 2026-07-29 | 데모 세트 기능 추가. NT 데모는 세트에 담지 않는다 (§1 분리 원칙 유지) |
| 2026-08-03 | NT 데모 6종에 `<앱>.app.next-tomorrow.online` 주소 부여. 구 주소는 그대로 서비스하되 목록에서는 회사 도메인만 노출 (§3.1). `greenai-proto` 를 `/opt/nt-greenai-catai` compose 관리로 전환 |
| 2026-08-19 | 이데쿠스덴키 PoC 2종(`idex-catai`, `idex-nt`) 등록. 고객 제안용이라 `listed: false`. 주소는 `<앱>.proto.next-tomorrow.online` — 고객 PoC용으로 `app.` 대신 `proto.` 계층 사용 |
