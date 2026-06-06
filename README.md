# 유학생 커뮤니티 플랫폼

이 프로젝트는 유학생을 위한 커뮤니티 및 소셜 플랫폼입니다. 현재 프론트엔드 개발, API 연동, 테스트, 검수의 기준 디렉터리는 모두 `new_fronted` 입니다.

## 디렉터리 구조

```text
backend/        Kotlin + Spring Boot 백엔드 서비스
new_fronted/    현재 기준 프론트엔드, Vite + React + TypeScript
database/       MySQL 스키마 스크립트
doc/            기획 문서 및 협업 문서
frontend/       과거 프론트엔드 디렉터리, 현재 기준 아님
adminFrontend/  과거 관리자 프론트엔드 프로토타입, 현재 기준 아님
```

## 현재 구현 범위

백엔드는 로그인, 사용자 프로필, 학생 인증, 매칭 추천, 커뮤니티 게시글, 서클, 메시지 대화, 공략/가이드 문서 등의 모듈을 포함하고 있습니다.  
`new_fronted` 는 이미 일부 백엔드 API 와 연결되어 있으며, 메시지, 연락처, 사용자 프로필, 일부 서클 데이터는 실제 API 에서 읽어옵니다. 그 외 일부 화면은 아직 목업 데이터가 남아 있습니다.

## 실행 방법

### 1. 백엔드 실행

기본 설정은 로컬 MySQL 데이터베이스 `student_community` 를 사용합니다.

```bash
cd backend
./gradlew bootRun
```

실제 이메일 인증 코드를 사용하려면 SMTP 환경 변수를 먼저 설정한 뒤 백엔드를 실행해야 합니다.

```bash
export MAIL_HOST=smtp.qq.com
export MAIL_PORT=587
export MAIL_USERNAME=your_account@qq.com
export MAIL_PASSWORD=your_smtp_auth_code
export MAIL_FROM=your_account@qq.com
```

백엔드 기본 주소:

```text
http://localhost:8080
```

Swagger 주소:

```text
http://localhost:8080/swagger-ui.html
```

### 2. 프론트엔드 `new_fronted` 실행

```bash
cd new_fronted
npm install
npm run dev
```

Vite 기본 주소:

```text
http://localhost:5173
```

`new_fronted/vite.config.ts` 에 프록시가 설정되어 있으므로 `/api/*` 요청은 아래 백엔드 주소로 전달됩니다.

```text
http://localhost:8080
```

### 3. 프론트엔드 빌드

```bash
cd new_fronted
npm run build
```

빌드 결과물은 다음 위치에 생성됩니다.

```text
new_fronted/dist/
```

## 로컬 로그인 안내

`new_fronted` 실행 후 기본 진입 화면은 로그인 페이지입니다.

로컬 연동 테스트에 사용할 수 있는 기본 계정:

```text
demo@student.app / 123456
```

다른 계정을 테스트하려면 로그인 화면에서 해당 이메일과 비밀번호를 직접 입력하면 됩니다.

인증 코드는 현재 아래 3개 시나리오에서 재사용됩니다.

- 회원가입: `POST /api/v1/auth/send-code` with `scene=REGISTER`, 이후 `POST /api/v1/auth/register`
- 인증코드 로그인: `POST /api/v1/auth/send-code` with `scene=LOGIN`, 이후 `POST /api/v1/auth/login/code`
- 비밀번호 재설정: `POST /api/v1/auth/send-code` with `scene=RESET_PASSWORD`, 이후 `POST /api/v1/auth/reset-password`

## 주의 사항

- 현재 프론트엔드 기준 디렉터리는 `new_fronted` 입니다.
- 백엔드 기본 포트는 `8080`, 프론트엔드 개발 서버 기본 포트는 `5173` 입니다.
- 프론트엔드 API 기본 경로는 `/api/v1` 입니다.
- `frontend` 와 `adminFrontend` 는 저장소에 남아 있지만, 현재 구현/연동/검수 기준은 아닙니다.
- `new_fronted/dist/`, `new_fronted/mobile-builds/`, `backend/bin/`, `backend/uploads/` 는 배포 산출물 또는 런타임 파일이므로 Git 추적 대상에서 제외합니다.
