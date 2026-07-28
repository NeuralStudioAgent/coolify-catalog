# Coolify Deploy Catalog

Coolify에 배포된 앱 이름·URL·설명을 한 페이지에서 검색합니다.

- URL: https://coolify.app.genver.online/
- Coolify DB(`applications`)를 읽어 목록을 만들고, `extras.json`의 수동 배포 항목을 합칩니다.

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
