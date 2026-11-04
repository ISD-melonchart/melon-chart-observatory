import fs from 'node:fs/promises';

export const POLICY_DATE = '2026년 11월 4일';
export const REPOSITORY_URL = 'https://github.com/ISD-melonchart/melon-chart-observatory';
export const CONTACT_URL = REPOSITORY_URL + '/issues';
const melonTerms = 'https://info.melon.com/terms/web/terms1_1.html';
const melonPrivacy = 'https://info.melon.com/terms/web/terms3.html';
const githubPrivacy = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';
const ext = (url, text) => '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';

export const publicFooter = `<footer class="site-footer" aria-label="서비스 정보">
  <div><strong>CHART ROOM</strong><p>멜론 차트를 기록하는 비공식 서비스입니다. Melon 및 아티스트·소속사의 공식 서비스나 제휴 서비스가 아닙니다.</p><p>곡명·이미지·차트 정보의 권리는 각 권리자에게 있습니다. 데이터 출처: ${ext('https://www.melon.com/chart/index.htm', 'Melon')}.</p></div>
  <nav aria-label="정책 및 문의"><a href="./terms/">서비스 이용약관</a><a href="./privacy/">개인정보처리방침</a><a href="./sources/">데이터 출처·수집 기준</a>${ext(CONTACT_URL, '오류·권리 문의')}</nav>
</footer>`;

const pages = {
  terms: {
    title: '서비스 이용약관',
    lead: '차트 기록을 함께 보기 위한 서비스의 범위와 이용 기준을 안내합니다.',
    body: `<section><h2>1. 서비스의 목적과 운영자</h2><p>CHART ROOM은 공개된 음악 차트 정보의 변화를 기록하고 살펴볼 수 있도록 제공하는 무료·비공식 서비스입니다. 운영 계정은 ${ext('https://github.com/ISD-melonchart', 'ISD-melonchart')}이며, 회원가입·결제 없이 차트를 열람할 수 있습니다.</p><p>Melon, 카카오엔터테인먼트, 아티스트 및 소속사의 공식 서비스가 아니며, 제휴·후원·공식 승인을 받았다는 뜻으로 상표나 이름을 사용하지 않습니다.</p></section>
    <section><h2>2. 제공하는 정보</h2><p>TOP100 순위·곡명·아티스트·이미지, HOT100 공개 상위 5곡 그래프, 곡별 10분 감상자수, 30·40·50분 예측과 저장된 기록의 비교를 제공합니다. 음원의 재생·다운로드나 멜론 계정 연동은 제공하지 않습니다.</p><p>예측 순위는 다음 정각을 예상한 원본의 값이며 공식 확정 순위와 구분합니다. HOT100 그래프 수치는 실제 감상자수로 환산하지 않습니다. 10분 감상자수를 더해 일간 순감상자수로 표시하지 않습니다.</p></section>
    <section><h2>3. 갱신과 기록의 한계</h2><p>TOP100은 정각, HOT100은 5분, 감상자수는 10분 기준으로 수집을 시도합니다. 실제 수집·배포 시점은 실행 환경이나 원본의 제공 상황에 따라 늦어질 수 있습니다. 화면의 원본 기준 시각과 마지막 수집 시도를 함께 확인해 주세요.</p><p>누락되거나 검증할 수 없는 자료는 0 또는 다른 시각의 값으로 채우지 않습니다. 전일 비교는 같은 곡·같은 시각의 두 기록이 확인될 때만 제공합니다. 원본이 변경·중단되면 일부 기능이나 기록이 제공되지 않을 수 있습니다.</p></section>
    <section><h2>4. 데이터 출처와 권리</h2><p>곡명·아티스트·앨범 이미지·차트 등 원본 정보의 출처는 Melon이며, 관련 권리는 각 권리자에게 있습니다. ${ext(melonTerms, '멜론 이용약관')} 및 관련 법령을 함께 확인해 주세요.</p><p>출처를 표시하는 것만으로 원본 데이터나 이미지의 복제·배포·상업적 이용 허락을 받는 것은 아닙니다. 이 안내는 이용자에게 원본 콘텐츠의 재이용 권한을 부여하지 않습니다. 수치나 이미지를 인용·재사용하려면 필요한 권리와 이용 조건을 별도로 확인해야 합니다.</p></section>
    <section><h2>5. 이용 시 지켜야 할 사항</h2><p>서비스와 데이터의 출처·기준 시각을 왜곡하거나 공식 서비스로 오인시키는 방식으로 사용하지 마세요. 타인의 권리를 침해하거나 서비스에 과도한 요청을 보내 운영을 방해해서는 안 됩니다. 원본 제공자의 접근 제한을 우회하는 기능은 제공하지 않습니다.</p></section>
    <section><h2>6. 오류·권리 문의와 서비스 변경</h2><p>오류 정정, 권리 침해 주장 또는 표시 중단 요청은 ${ext(CONTACT_URL, '운영 저장소의 문의 게시판')}으로 접수할 수 있습니다. 대상 주소·곡·원본 시각·요청 사유를 알려 주세요. 게시판은 공개되어 있으므로 연락처 등 민감한 개인정보는 적지 마세요.</p><p>원본 제공 상황, 권리자 요청 또는 운영 사정에 따라 표시 내용을 수정하거나 제공을 중단할 수 있습니다. 중요한 변경은 이 페이지 또는 사이트 안내에 게시합니다. 이 약관은 관계 법령에 따른 이용자의 권리를 제한하거나 운영자의 고의·중대한 과실에 따른 책임을 배제하지 않습니다.</p></section>`,
  },
  privacy: {
    title: '개인정보처리방침',
    lead: '차트 열람 과정에서 사용되는 정보와 외부 서비스의 처리를 구분하여 안내합니다.',
    body: `<section><h2>1. 서비스가 직접 수집하는 정보</h2><p>현재 CHART ROOM에는 회원가입·로그인·결제·댓글·알림 구독 기능이 없습니다. 차트 열람을 위해 이름, 이메일, 전화번호, 멜론 계정이나 비밀번호를 입력받지 않습니다.</p><p>곡·아티스트 검색은 현재 브라우저에 불러온 차트 안에서 처리하며, 검색어를 운영자에게 전송하거나 저장하지 않습니다. 자체 광고·방문자 분석 도구 및 추적용 쿠키·로컬 저장소를 사용하지 않습니다.</p></section>
    <section><h2>2. 저장하는 차트 기록</h2><p>서버 측 수집 작업은 곡 ID·곡명·순위·공개 그래프·집계 감상자수와 원본 기준 시각을 저장합니다. 개별 멜론 이용자의 계정이나 재생 이력을 수집하지 않습니다. 차트 기록은 공개 GitHub 저장소와 사이트에서 제공되며 전일 비교 및 기록 열람에 사용됩니다.</p></section>
    <section><h2>3. 호스팅과 외부 이미지 요청</h2><table><thead><tr><th scope="col">제공자</th><th scope="col">발생할 수 있는 처리</th></tr></thead><tbody><tr><td>GitHub Pages</td><td>웹페이지와 JSON 파일을 제공합니다. GitHub는 보안을 위해 방문자의 IP 주소를 기록·보관한다고 안내합니다. 관련 처리는 GitHub의 정책에 따르며, 운영자는 GitHub의 보안 로그를 직접 제공받아 별도 보관하지 않습니다.</td></tr><tr><td>Melon 및 이미지 제공 서버</td><td>앨범 이미지를 표시할 때 브라우저가 원본 이미지 서버에 직접 요청하므로 IP 주소와 브라우저 요청 정보가 전달될 수 있습니다. 사이트 주소가 참조 주소로 전달되지 않도록 referrer 정책을 설정합니다.</td></tr></tbody></table><p>외부 제공자의 보관 기간·처리 위치·처리 기준은 각 제공자의 정책에 따르며 해외 서버에서 처리될 수 있습니다. 자세한 내용은 ${ext(githubPrivacy, 'GitHub 개인정보처리방침')}과 ${ext(melonPrivacy, 'Melon 개인정보처리방침')}을 확인해 주세요.</p></section>
    <section><h2>4. 문의 게시판을 이용하는 경우</h2><p>문의는 ${ext(CONTACT_URL, 'GitHub Issues')}에서 접수합니다. 문의를 등록하면 GitHub 계정명과 작성 내용이 해당 게시판에 공개될 수 있으며 GitHub의 정책이 적용됩니다. 전화번호·주소·계정 비밀번호 등 민감한 정보를 공개 게시물에 포함하지 마세요.</p><p>운영 계정은 ${ext('https://github.com/ISD-melonchart', 'ISD-melonchart')}입니다. 사이트의 정보 처리에 관한 질문이나 공개된 개인정보의 정정·삭제 요청도 이 경로로 전달할 수 있습니다. 운영자가 직접 처리하는 정보의 범위에서 요청을 확인하고, 외부 제공자에게 직접 요청해야 하는 사항은 해당 제공자의 개인정보 안내를 확인해 주세요.</p></section>
    <section><h2>5. 이용자의 선택과 방침 변경</h2><p>브라우저에서 외부 이미지 로딩과 쿠키를 제한할 수 있습니다. 외부 이미지를 차단해도 텍스트 차트와 저장된 집계 수치는 열람할 수 있습니다.</p><p>향후 회원가입·분석·광고·알림 등 새로운 정보 처리가 추가되면 실제 변경 내용을 반영해 이 방침과 적용일을 안내하고, 법령에 따라 필요한 조치를 진행합니다.</p></section>`,
  },
  sources: {
    title: '데이터 출처·수집 기준',
    lead: '같은 시각의 기록을 정확히 비교할 수 있도록 원본 기준 시각을 보존합니다.',
    body: `<section><h2>출처와 표시 항목</h2><p>원본 출처는 ${ext('https://www.melon.com/chart/index.htm', 'Melon TOP100 및 공개 차트 화면')}입니다. 공개 웹 응답에서 확인되는 곡명·아티스트·앨범 이미지·차트 수치를 기록합니다. 본 사이트와 Melon 사이의 공식 제휴나 데이터 이용 허락을 의미하지 않습니다.</p><table><thead><tr><th scope="col">자료</th><th scope="col">원본 기준과 해석</th></tr></thead><tbody><tr><td>TOP100</td><td>매 정각의 확정 순위 100곡입니다. 원본의 날짜·시각과 곡 수를 확인합니다.</td></tr><tr><td>HOT100 그래프</td><td>5분 기준으로 제공되는 상위 5곡의 그래프 수치입니다. TOP100 전체 100곡의 그래프나 실제 감상자수와 동일한 값이 아닙니다.</td></tr><tr><td>실시간 감상자수</td><td>원본의 10분 기준 시각을 확인해 곡별 집계 값을 기록합니다. 서로 다른 10분 구간의 이용자가 중복될 수 있어 합계를 일간 순감상자수로 사용하지 않습니다.</td></tr><tr><td>30·40·50분 예측</td><td>각 회차에 원본이 제공한 다음 정각의 예상 순위를 별도로 기록합니다. 원본에 예측이 없으면 현재 공식 순위를 대신 넣지 않습니다.</td></tr><tr><td>전일 비교·리뷰</td><td>같은 곡 ID와 전일 같은 시각의 기록이 함께 있을 때만 비교합니다. 일간 순감상자수 원본은 현재 미연결이며 해당 비교를 제공하지 않습니다.</td></tr></tbody></table></section>
    <section><h2>자동 수집과 새로고침</h2><p>수집 작업은 다음 5분 구간을 자동으로 이어 실행합니다. 원본 반영 시간을 고려해 구간 시작 후 약 12초부터 다음 작업의 실행을 요청합니다. 원본 갱신 대기나 일시적인 오류에는 1분 안에서 한 번 재시도합니다. 원본의 응답과 실행·배포 대기 때문에 화면 반영이 늦어질 수 있습니다.</p><p>방문자가 없어도 실행되며, 사이트는 저장된 자료를 30초마다 다시 확인합니다. ‘기록 새로고침’은 이미 저장된 자료를 다시 불러옵니다. 화면의 ‘자동 수집 지연’은 마지막 확인 이후 새 수집 시도가 오래 없는 상태를, ‘일부 자료 갱신 대기’는 수집을 시도했지만 일부 원본이 아직 확인되지 않은 상태를 뜻합니다.</p></section>
    <section><h2>누락과 변경 처리</h2><p>실패·누락 자료는 0으로 바꾸지 않고 마지막 확인 자료의 실제 기준 시각을 유지합니다. 미수집 구간을 뒤늦게 현재 값으로 채우거나 예측하지 않습니다. 과거 원본이 수정되면 이미 저장된 기록과 달라질 수 있습니다.</p><p>원본 정보의 이용에는 ${ext(melonTerms, 'Melon 이용약관')}과 각 권리자의 권리가 적용됩니다. 출처 표기만으로 복제·배포·상업적 이용에 대한 허락을 받는 것은 아닙니다. 문의는 ${ext(CONTACT_URL, '운영 저장소')}로 전달할 수 있습니다.</p></section>`,
  },
};

const css = `*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#172229;font:15px/1.9 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}a{color:#087655;text-underline-offset:4px}a:focus-visible{outline:3px solid #0cbb84;outline-offset:4px}header,main,footer{max-width:900px;margin:0 auto;padding:28px}header{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #e1e9e6}.brand{font-size:22px;font-weight:900;letter-spacing:-1px;text-decoration:none;color:#172229}.brand::before{content:'';display:inline-block;width:15px;height:21px;background:#12b984;transform:skew(-15deg);margin-right:10px;vertical-align:middle}nav{display:flex;flex-wrap:wrap;gap:18px}main{background:#fff;margin:32px auto;border:1px solid #e2e9e5;border-radius:14px;padding:48px}h1{font-size:34px;letter-spacing:-1.4px;line-height:1.4;margin:8px 0 14px}h2{font-size:20px;letter-spacing:-.5px;margin-top:38px}p{margin:12px 0;color:#42545b}.eyebrow{font-size:11px;letter-spacing:2px;color:#659086}.lead{font-size:17px}.date{font-size:13px;color:#74838b}.notice{background:#edf8f3;border-left:3px solid #0bb880;padding:16px 20px;margin:28px 0}table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}td,th{padding:14px;border:1px solid #e1e9e5;text-align:left;vertical-align:top}th{background:#f1f8f4}td:first-child{min-width:110px}footer{padding-bottom:48px;font-size:13px;color:#74838b}@media(max-width:680px){header{align-items:flex-start;flex-direction:column;padding:22px}main{margin:18px 12px;padding:26px 20px}h1{font-size:28px}nav{gap:12px;font-size:13px}table{font-size:13px}td,th{padding:10px}td:first-child{min-width:76px}}`;

export async function writePolicyPages(directory) {
  for (const [slug, page] of Object.entries(pages)) {
    const target = new URL(slug + '/', directory);
    await fs.mkdir(target, {recursive:true});
    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="description" content="CHART ROOM ${page.title}"><title>${page.title} · CHART ROOM</title><style>${css}</style></head><body><header><a class="brand" href="../">CHART ROOM</a><nav aria-label="사이트 안내"><a href="../terms/">이용약관</a><a href="../privacy/">개인정보처리방침</a><a href="../sources/">데이터 출처</a></nav></header><main><div class="eyebrow">CHART ROOM / SERVICE INFORMATION</div><h1>${page.title}</h1><p class="lead">${page.lead}</p><p class="date">시행일 · ${POLICY_DATE}</p><div class="notice">회원가입 없이 이용하는 비공식 차트 기록 서비스입니다. 원본 콘텐츠의 권리는 각 권리자에게 있습니다.</div>${page.body}</main><footer><p>CHART ROOM · 비공식 차트 기록 서비스</p><a href="../">← 차트 대시보드로 돌아가기</a> · ${ext(CONTACT_URL, '오류·권리 문의')}</footer></body></html>`;
    await fs.writeFile(new URL('index.html', target), html);
  }
}
