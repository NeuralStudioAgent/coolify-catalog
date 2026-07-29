# Coolify Deploy Catalog

Coolify에 배포된 앱 이름·URL·설명을 한 페이지에서 검색합니다.

- 일반 목록: https://demo.app.genver.online/ (구 `coolify.app.genver.online` → 301)
- 데모 세트: https://demo.app.genver.online/sets
- Next-Tomorrow Demo List: https://demo.app.next-tomorrow.online/ (JP 기본 / KR 토글, 구 `nt-demos.app.genver.online` → 301)

## 데모 세트

고객사 미팅에서 보여줄 데모만 골라 묶어두고, 그 화면을 그대로 띄워 시연한다.

1. 카탈로그에서 **데모 고르기** → 보여줄 항목 체크 → **세트로 저장**
2. `/sets`에서 이름·순서·설명·주소를 편집 (내부 앱 이름 대신 고객용 이름으로 바꿀 수 있다)
3. 미팅에서 `/show/<주소>`를 띄우고 카드를 클릭하면 해당 데모가 새 탭으로 열린다.
   숫자 키 `1`~`9`로도 바로 열린다.

세트는 `data/sets.json`에 저장된다. 이 디렉터리는 컨테이너 바깥에 바인드 마운트되어
있으므로 이미지를 다시 빌드해도 남는다. 백업은 이 파일 하나만 챙기면 된다.

편집은 기본적으로 잠겨 있지 않다. 잠그려면 `.env`에 `EDIT_KEY`를 넣고 다시 올리면
저장·수정·삭제할 때 그 값을 요구한다. 보기와 발표는 언제나 비밀번호 없이 된다.

## 정책 (필독)

NT(next-tomorrow)와 일반 배포 목록 분리, mockup/proto 구분, 신규 등록 절차는 아래 문서를 따른다.

→ **[docs/NT_CATALOG_POLICY.md](docs/NT_CATALOG_POLICY.md)**

## 로컬

```bash
cp .env.example .env   # DB 접속 정보
npm install
npm start
```

## 서버 배포 (`/opt/coolify-catalog`)

```bash
# Coolify DB 비밀번호만 .env에 넣기
# DB_USERNAME=coolify
# DB_PASSWORD=...
docker compose up -d --build
```
