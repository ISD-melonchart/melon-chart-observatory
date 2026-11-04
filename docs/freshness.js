const MINUTE = 60_000;
const stamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
  ? Date.parse(value + ':00+09:00') : NaN;
const display = value => Number.isFinite(value) ? new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit',
  minute: '2-digit', hour12: false,
}).format(new Date(value)) : '기록 없음';

export function describeCollection(data, now = Date.now()) {
  const attempted = stamp(data?.status?.attemptedAt);
  const exported = Date.parse(data?.exportedAt || '');
  const last = Number.isFinite(attempted) ? attempted : exported;
  const expected = Math.floor(now / (5 * MINUTE)) * 5 * MINUTE;
  const next = expected + 5 * MINUTE;
  const details = '마지막 수집 시도 ' + display(last) +
    ' KST · 다음 수집 목표 ' + display(next) + ' KST';
  if (!Number.isFinite(last)) return {level: 'waiting', label: '첫 자동 수집 대기', details};
  if (now - last > 8 * MINUTE) return {
    level: 'delayed', label: '자동 수집 지연',
    details: '자동 수집이 늦어지고 있습니다. ' + details + ' · 표시된 원본 시각을 확인하세요.',
  };
  const stale = [
    ['TOP100', data?.top, 60], ['HOT100', data?.hot, 5], ['감상자수', data?.listeners, 10],
  ].filter(([, record, interval]) => {
    const boundary = Math.floor(now / (interval * MINUTE)) * interval * MINUTE;
    const source = stamp(record?.sourceAt);
    return now - boundary > 2 * MINUTE && (!Number.isFinite(source) || source < boundary);
  }).map(([label]) => label);
  if (data?.status?.errorCount || stale.length) return {
    level: 'partial', label: '일부 자료 갱신 대기',
    details: (stale.length ? stale.join(' · ') + '의 새 자료를 기다리고 있습니다. ' : '') + details,
  };
  return {level: 'current', label: '자동 수집 중', details};
}
