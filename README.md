# 프로그램 신청 앱 (Vercel + GitHub 저장)

**비용 없이** GitHub 저장소의 JSON 파일을 데이터베이스처럼 사용하고, **Vercel**에 배포해 동작합니다.
- 별도 DB나 Firebase 없이 동작 (GitHub API로 `data/*.json` 읽기/쓰기)
- 중복신청 방지(전화+프로그램+회차), 정원/잔여좌석 계산, 관리자 검색/목록
- 기본 프로그램은 `GET /api/programs` 호출 시 자동 생성(없을 때만)

## 0) 사전 준비
- GitHub에 리포지토리 생성(예: `program-signup`) 후 **빈 리포여도 OK**
- 이 코드를 리포지토리에 push

## 1) GitHub Personal Access Token 발급
- Settings → Developer settings → **Personal access tokens (classic)** → `repo` 권한 체크 → 발급
- 토큰 문자열을 Vercel의 프로젝트 환경변수에 넣습니다.

## 2) Vercel 프로젝트 생성/연결
- Vercel에서 **Import Project** → GitHub의 리포를 선택 → 연결
- Project Settings → **Environment Variables**에 아래 값 설정

```
GITHUB_TOKEN=ghp_xxx                # repo scope
GITHUB_OWNER=<your github user or org>
GITHUB_REPO=program-signup
GITHUB_BRANCH=main
GITHUB_PROGRAMS_PATH=data/programs.json
GITHUB_SUBMISSIONS_PATH=data/submissions.json
ADMIN_PASSWORD=admin123
```

> 첫 배포 후 `/api/programs`가 기본 프로그램을 자동 시드합니다. (파일이 없을 때만 생성)

## 3) 배포 & 접속
- 배포가 완료되면, 도메인(예: https://your-app.vercel.app/)에 접속
- 신청 완료 시 `/api/submissions`가 `data/submissions.json` 파일을 생성/갱신합니다.

## 4) 주의/한계
- GitHub 파일을 빈번히 쓰면 레이트리밋에 걸릴 수 있습니다(일반 사용에는 충분). 대규모 사용 시 DB 전환 고려.
- 동시성: 본 설계는 간단한 낙관적 업데이트로 동시 신청을 대부분 처리하지만, 극단적 경합에서는 충돌 가능성 있습니다.
- 보안: 관리자 비밀번호는 간단 프롬프트 수준입니다. 운영 시 서버 인증(세션/쿠키) 보강을 권장합니다.
- 데이터 경로: `data/programs.json`과 `data/submissions.json`은 리포의 기본 브랜치에 생성됩니다.

## 5) 로컬 개발
```bash
npm i
npm run dev
# http://localhost:3000
```
