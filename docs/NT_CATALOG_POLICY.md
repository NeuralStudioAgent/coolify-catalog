# Next-Tomorrow (NT) 카탈로그 정책

이 문서는 Coolify 배포 목록과 Next-Tomorrow(NT) 데모 목록을 **분리 관리**하는 규칙을 정의한다.  
앞으로 배포·등록·문서화 시 이 정책을 따른다.

---

## 1. 두 목록의 역할

| 목록 | URL | 대상 |
|------|-----|------|
| **일반 Deploy Catalog** | https://demo.app.genver.online/ | teamver / genver 등 일반·데모 배포 |
| **Next-Tomorrow Demo List** | https://nt-demos.app.genver.online/ | NT(next-tomorrow) 고객/회사용 데모만 |

- NT 항목은 **일반 목록에 표시하지 않는다.**
- NT 목록은 **일본어(JP) 기본**, 한국어(KR)는 토글 옵션 (pmnt와 동일 패턴).
- 페이지 제목: **Next-Tomorrow Demo List**

---

## 2. NT로 분류하는 기준

다음 중 하나라도 해당하면 NT로 관리한다.

1. Next-Tomorrow(NT) 회사용으로 배포·시연하는 앱
2. Green AI / CAT.AI 등 NT 맥락의 데모·프로토
3. NT 전용 도구로 쓰는 보드 (예: 프로젝트 관리 `pmnt`)

애매하면 **NT로 넣고**, 일반 목록에는 올리지 않는다.

---

## 3. 현재 NT 등록 목록

설정 파일: [`nt-apps.json`](../nt-apps.json)

| key | 구분 (`kind`) | URL (대표) |
|-----|----------------|------------|
| `nti-demo` | mockup | https://nti-demo.app.genver.online |
| `farm-support` | mockup | https://farm-support.app.teamver.online |
| `open-inno` | mockup | https://open-inno.app.teamver.online |
| `open-inno-catai` | mockup | https://open-inno-catai.app.teamver.online |
| `greenai-proto` | **proto** | https://greenai-proto.app.genver.online |
| `pmnt` | *(없음 — 도구)* | https://pmnt.app.genver.online |

목록이 바뀌면 **반드시 `nt-apps.json`과 이 표를 함께 갱신**한다.

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
2. [`nt-apps.json`](../nt-apps.json)에 항목을 추가한다.
   - `key`, `matchNames`, `matchHosts`, `urls`
   - `title` / `description` — **jp · kr 둘 다**
   - `kind`: `"mockup"` | `"proto"` | `null`
3. 일반 목록용 [`extras.json`](../extras.json)에는 **넣지 않는다** (중복·유출 방지).
4. 이 문서 **§3 표**를 업데이트한다.
5. 배포: `/opt/coolify-catalog` 동기화 후 `docker compose up -d --build`.
6. 확인:
   - NT: https://nt-demos.app.genver.online/ 에 보이는지
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
| `public/` | 일반 카탈로그 UI |
| `public/nt/` | NT Demo List UI (JP/KR) |
| `docker-compose.yml` | Host: `demo.app.genver.online`, `nt-demos.app.genver.online` (구 `coolify.app` → 301) |

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
| 2026-07-29 | 데모 세트 기능 추가. NT 데모는 세트에 담지 않는다 (§1 분리 원칙 유지) |
