# Coolify Deploy Catalog

Coolify에 배포된 앱 이름·URL·설명을 한 페이지에서 검색합니다.

- 일반 목록: https://coolify.app.genver.online/
- Next-Tomorrow Demo List: https://nt-demos.app.genver.online/ (JP 기본 / KR 토글)

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
