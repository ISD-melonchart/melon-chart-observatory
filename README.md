# CHART ROOM · GitHub Pages 공개 배포판

기존 차트 사이트 화면과 TOP100·HOT100·감상자수·30/40/50분 예측 기능을 옮긴 배포용 프로젝트입니다.

**공개 GitHub 저장소 + GitHub Pages + GitHub Actions만 사용합니다. 별도 서버 계정, ChatGPT 로그인, API 키 설정은 필요하지 않습니다.**

## 처음 배포하는 순서

1. GitHub에서 **New repository → Public → 저장소 이름 `melon-chart` → Create repository**를 누릅니다. 기본 브랜치는 `main`으로 사용합니다.
2. 이 ZIP을 PC에서 **압축 해제**합니다. `chart-room-github-pages` 폴더 **안의 내용 전체**를 GitHub 저장소의 `Add file → Upload files`에 올리고 Commit 합니다. ZIP 파일 자체를 올리는 것이 아닙니다. `.github` 폴더도 반드시 포함하세요.
3. 저장소의 **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**를 설정합니다. 조직 정책으로 수정이 막혀 있으면 해당 저장소에서 Actions의 데이터 기록 권한이 허용되어야 합니다.
4. **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
5. **Actions → Collect charts and deploy Pages → Run workflow → main → Run workflow**를 누릅니다. Actions 사용 동의 화면이 먼저 나오면 이 저장소의 워크플로를 활성화합니다.
6. 완료되면 **Settings → Pages → Visit site**에 누구나 로그인 없이 열 수 있는 링크가 표시됩니다. 일반적인 주소 형태는 `https://깃허브아이디.github.io/melon-chart/`이며, 실제 주소는 Pages 화면에 표시된 값을 사용하세요.

예상 저장소 루트 구조는 다음과 같습니다. 상위 `chart-room-github-pages` 폴더를 한 겹 더 넣지 마세요.

- `.github/workflows/collect-and-deploy.yml`
- `docs/index.html`, `docs/data-client.js`, `docs/data/`
- `scripts/`, `lib/`, `tests/`
- `original-site/`, `package.json`, `README.md`

`.github/workflows/collect-and-deploy.yml`이 보이지 않으면 자동 수집이 실행되지 않습니다. 웹 업로드가 `.github`를 누락했다면 GitHub의 **Add file → Create new file**에서 해당 경로로 파일을 만들고 ZIP 안의 같은 YAML 내용을 붙여넣어 Commit 할 수 있습니다.

## 동작 방식

| 항목 | 수집 및 표시 |
| --- | --- |
| 공개 화면 | GitHub Pages에서 저장된 JSON을 읽어 표시. 방문자 로그인 불필요 |
| 수집 작업 | 실행 중인 작업이 다음 5분 구간의 작업을 자동 요청. 예약은 중단 복구용으로 사용 |
| TOP100 | 원본의 정각 기준 시각을 검증하고 100곡·곡명·이미지·아티스트 저장 |
| HOT100 | 원본이 제공하는 상위 5곡의 5분 그래프. 감상자수로 환산하지 않음 |
| 감상자수 | 원본의 10분 기준 시각을 검증하여 각 곡의 값을 저장 |
| 예측 순위 | 30·40·50분 원본을 각각 기록. 다음 정각 예상 순위와 공식 순위를 구분 |
| 전일 비교 | 동일한 곡 ID와 정확히 전일 같은 시각의 기록이 둘 다 있을 때 계산 |
| 일별 리뷰 | 날짜별 `docs/data/reviews/`에 저장. 일간 순감상자수 원본은 아직 미연결 |
| 기록 새로고침 버튼 | 이미 수집·배포된 최신 JSON을 다시 읽음. 방문자의 클릭으로 Actions를 실행하지 않음 |
| 수집 강제 실행 | 저장소 소유자가 Actions의 Run workflow 사용 |

**자동 수집은 다음 작업을 스스로 이어 실행합니다. 매번 Run workflow를 누를 필요가 없습니다.** 구간 시작 후 12초부터 다음 작업을 요청하며, 별도 계정이나 장기 API 키를 추가하지 않습니다.

실행·배포 대기나 원본 제공 지연 때문에 정확한 실행 시각과 모든 구간의 수집을 보장하지는 않습니다. 작업 대기, 서비스 제한, 원본 반영 지연으로 수집이 늦어지거나 구간이 빠질 수 있습니다. 원본의 날짜·시각을 보존하며, 지나간 예측·누락 감상자수는 다른 시각 값이나 0으로 메우지 않습니다. GitHub 전체 장애나 장기간 실행 제한까지 견디는 수집이 필요하면 전용 실행 환경을 사용할 수 있습니다.

GitHub는 공개 저장소의 활동이 장기간 없으면 예약 워크플로를 중지할 수 있습니다. 수집 중단 여부는 Actions 실행 목록과 사이트에 표시되는 원본 기준 시각으로 확인하세요.

## 기록과 기존 데이터

- `docs/data/`에 원본 시각별 JSON을 남기고 Actions가 저장소에 Commit 합니다. 기본 동작은 기록을 자동 삭제하지 않습니다.
- ZIP에는 기존 사이트에서 실제로 읽은 최근 스냅샷이 포함되어 있습니다. 파일에 적힌 원본 기준 시각 그대로 표시합니다. 과거의 전체 서버 기록을 모두 옮긴 ZIP은 아닙니다.
- GitHub 배포 후 새 수집부터 이 저장소에 독립적으로 기록이 쌓입니다. 전일 비교는 해당 시각의 전일 기록이 있어야 표시됩니다.
- GitHub Pages는 정적 호스팅이므로 기존 비공개 사이트의 `/api/update`를 공개 브라우저에서 호출하지 않습니다. 기존 사이트의 접근 토큰이나 로그인 정보를 넣을 필요가 없습니다.
- 원본 출처에 접근할 수 없는 경우 마지막 확인값과 그 기준 시각을 유지하고, 수집 오류를 표시합니다.
- 10분 감상자수를 합산해 일간 순감상자수로 계산하지 않습니다. HOT100 점수 역시 실제 이용자 수로 단정하지 않습니다.
- 장기 운영 시 저장소·Pages의 용량 및 사용 제한을 확인하세요. 오래된 기록을 별도 저장소로 이동하려면 먼저 JSON을 백업하세요.

## 자동 수집을 시작·중지하는 방법

- 수정 코드를 `main`에 Commit하면 자동으로 수집·배포를 시작합니다. 이후 각 실행이 다음 5분 구간의 실행을 요청합니다. `actions: write` 권한이 필요하며 포함된 워크플로에 선언되어 있습니다.
- 배포가 끝난 뒤 `Continue collection automatically at the next five-minute slot` 단계에서 기다리는 것은 정상입니다. 이미 갱신된 사이트를 볼 수 있으며, 다음 구간이 되면 다음 실행을 요청하고 종료합니다. 실행 간격에 맞춰 러너를 사용하므로 짧은 수집만 하는 이전 구성보다 러너 사용 시간이 늘어납니다. 현재 구성은 공개 저장소의 표준 Ubuntu 러너만 사용합니다. 비공개 저장소로 바꿀 경우 GitHub의 요금·사용 한도를 먼저 확인하세요.
- 자동 연결이 중단되면 매시 2·17·32·47분 예약이 복구를 시도합니다. 이 예약 자체는 GitHub 측 사정으로 지연될 수 있습니다.
- 전체 일시중지: Actions에서 `Collect charts and deploy Pages`를 열고 우측 메뉴의 **Disable workflow**를 선택합니다. 실행 중인 작업까지 즉시 중지하려면 해당 실행도 취소합니다. 재개할 때 **Enable workflow → Run workflow**를 한 번 누릅니다.
- 저장소 변수 `CHART_COLLECTION_PAUSED`를 문자열 `true`로 설정해도 다음 실행부터 수집이 중지됩니다. 재개하려면 변수를 삭제하거나 `false`로 바꾸고 Run workflow를 한 번 실행합니다.
- 수동 점검용 `run_once`를 체크하면 해당 실행은 후속 작업을 요청하지 않습니다. 기본값은 체크 해제이며 자동으로 이어 실행합니다.
- 문제가 생기면 사이트의 마지막 수집 시도와 원본 시각, Actions의 수집 단계와 이어 실행 단계를 확인하세요. 빈 기록을 0으로 채워 정상 상태처럼 표시하지 않습니다.

## 출처·이용약관·개인정보 안내

사이트 하단과 수집 안내에서 `terms/`, `privacy/`, `sources/`로 이동할 수 있습니다. 가입·결제·분석 도구가 없는 현재 구현을 기준으로 작성했으며, GitHub의 보안 로그와 외부 앨범 이미지 요청을 구분해 설명합니다. 운영 문의는 기존 GitHub 저장소의 Issues를 사용합니다. 타 사이트의 담당자·전화번호·분석 도구 안내를 가져오지 않았습니다.

멜론 데이터와 이미지의 권리는 각 권리자에게 있으며 공식 제휴를 주장하지 않습니다. 출처 표기는 복제·배포 허락을 대신하지 않습니다. 실제 데이터 이용 조건과 필요한 허락은 운영자가 별도로 확인해야 합니다.

기능이나 운영 연락처를 바꾸면 `lib/public-policy-pages.mjs`도 실제 운영에 맞춰 수정하세요.

## 로컬 실행 / 개발

Node.js 22 이상에서 외부 패키지 설치 없이 동작합니다.

```bash
npm test
npm run build
npm run collect
npm run dev
```

`npm run collect`는 실제 멜론 공개 원본에 접근합니다. 네트워크 또는 원본 제한이 있는 환경에서는 수집이 실패할 수 있습니다. `npm run dev` 이후 표시되는 로컬 주소를 브라우저로 여세요. `docs/index.html`을 파일 더블클릭으로 여는 방식은 JSON 읽기가 제한될 수 있습니다.

## 배포가 안 될 때

- Actions 파일이 없거나 실행 목록이 없음: `.github/workflows/collect-and-deploy.yml`이 `main`의 루트 경로에 있는지 확인합니다.
- 데이터 Commit 단계에서 HTTP 403 / permission denied: Workflow permissions를 Read and write로 바꿉니다. 브랜치 보호 규칙이 Actions 쓰기를 막는 경우 해당 정책도 확인합니다.
- Configure Pages에서 실패: Settings → Pages → Source를 GitHub Actions로 선택한 뒤 Run workflow를 다시 실행합니다.
- 사이트는 열리지만 차트 시각이 오래됨: Actions의 최근 실행 결과를 확인하고 Run workflow로 새 수집을 요청합니다. GitHub 예약 실행이 지연될 수 있습니다.
- HOT100만 갱신되지 않음: 원본이 그래프를 제공하지 않는 시간에는 마지막 확인 기록이 남습니다. 제공되지 않은 시각의 값을 만들지 않습니다.

## 원본 소스

`original-site/`에는 확인한 기존 사이트 소스가 들어 있습니다. 현재 공개 배포는 `docs/`, `lib/`, `scripts/`, `.github/workflows/`를 사용합니다. 화면 생성 원본은 `original-site/worker/index.js`, 공개 화면 변경은 `scripts/build-pages.mjs`, 정책 문구는 `lib/public-policy-pages.mjs`에서 관리합니다. `docs/index.html`만 수정하면 다음 빌드에서 덮어써집니다. 원본 사이트의 Git 저장소 메타데이터, Sites 프로젝트 설정 및 접근 자격증명은 포함하지 않았습니다. 이 ZIP을 만드는 과정에서 기존 사이트를 재배포하거나 공개 범위를 바꾸지 않았습니다.

## 공식 참고 문서

- [GitHub Pages는 정적 사이트 호스팅](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Actions로 Pages 배포 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Pages 배포 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [예약 실행의 최소 간격·지연·중지 조건](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
