# Coolify Deploy Catalog

Coolify에 배포된 앱 이름·URL·설명을 한 페이지에서 검색합니다.

- 일반 목록: https://coolify.app.genver.online/
- Next-Tomorrow Demo List: https://nt-demos.app.genver.online/ (JP 기본 / KR 토글)
- NT 데모(`nti-demo`, `farm-support`, `open-inno`, `open-inno-catai`, `greenai-proto`, `pmnt`)는 일반 목록에서 제외되고 `nt-apps.json`으로 분리 관리됩니다.

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
