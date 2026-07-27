# TBM AI Docker Starter

TypeScript 기반 `Node.js(Express)` 백엔드와 `React(Vite)` 프론트엔드를 Docker Compose로 실행하는 기본 템플릿입니다.

## 폴더 구조

- `backend`: TypeScript + Express API 서버
- `frontend`: React + TypeScript + Vite 앱
- `docker-compose.yml`: 프론트/백엔드 통합 실행 설정

## 실행 방법

```bash
docker compose up --build
```

실행 후:

- 프론트엔드: `http://localhost:5173`
- 백엔드 헬스체크: `http://localhost:4000/api/health`

## 종료

```bash
docker compose down
```
