const KST=9*3600000;
const stamp=t=>new Date(t+KST).toISOString().slice(0,16);
const floor=(at,m)=>stamp(Math.floor(Date.parse(at+':00+09:00')/(m*60000))*m*60000);
const nextHour=at=>stamp(Math.floor(Date.parse(at+':00+09:00')/3600000)*3600000+3600000);
const previous=at=>stamp(Date.parse(at+':00+09:00')-86400000);
const delta=(a,b)=>typeof a==='number'&&typeof b==='number'?{value:a-b,percent:b===0?null:(a-b)/b*100}:null;
export function recordPath(kind,at){if(!['top','hot','listeners','predictions','reviews'].includes(kind)||!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(at))throw Error('잘못된 기록 조건');return './data/'+kind+'/'+at.replaceAll(':','-')+'.json'}
async function read(path,fetcher,optional=false){const r=await fetcher(path+'?v='+Date.now(),{cache:'no-store'});if(optional&&r.status===404)return null;if(!r.ok)throw Error('기록 파일 응답 '+r.status);return r.json()}
export async function readHistory(kind,date,{fetcher=globalThis.fetch}={}){
 if(!['top','hot','listeners','predictions','reviews'].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('잘못된 기록 조건');
 const index=await read('./data/history-index.json',fetcher,true);return {records:(index?.records||[]).filter(r=>r.kind===kind&&r.sourceAt.startsWith(date))};
}
export async function readState(at=null,{fetcher=globalThis.fetch}={}){
 if(!at)return read('./data/state.json',fetcher);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)||!Number.isFinite(Date.parse(at+':00+09:00')))throw Error('잘못된 기록 시각');
 const lookup=(kind,t)=>read(recordPath(kind,t),fetcher,true);
 const [top,hot,listeners]=await Promise.all([lookup('top',floor(at,60)),lookup('hot',floor(at,5)),lookup('listeners',floor(at,10))]);
 const [prevTop,prevHot,prevListeners]=await Promise.all([top?lookup('top',previous(top.sourceAt)):null,hot?lookup('hot',previous(hot.sourceAt)):null,listeners?lookup('listeners',previous(listeners.sourceAt)):null]);
 const viewed=Date.parse(at+':00+09:00');
 const rounds=await Promise.all([30,40,50].map(async minute=>{const sourceAt=at.slice(0,14)+minute,ms=Date.parse(sourceAt+':00+09:00'),due=ms<=viewed,saved=due?await lookup('predictions',sourceAt):null;return {minute,sourceAt,targetAt:nextHour(sourceAt),rows:saved?.rows||[],expected:saved?.expected||100,receivedAt:saved?.receivedAt||null,closed:viewed>=ms+600000,status:!due?'scheduled':saved?.rows?.length===100?'complete':saved?.rows?.length?'partial':'missing'}}));
 const review=(top?.rows||[]).map(s=>{const l=listeners?.rows.find(r=>r.songId===s.songId),pl=prevListeners?.rows.find(r=>r.songId===s.songId),h=hot?.series.find(r=>r.songId===s.songId),ph=prevHot?.series.find(r=>r.songId===s.songId),pr=prevTop?.rows.find(r=>r.songId===s.songId);return {...s,predictions:Object.fromEntries(rounds.map(r=>[r.minute,r.rows.find(v=>v.songId===s.songId)||null])),listeners:l?.value??null,listenerDelta:delta(l?.value,pl?.value),hotValue:h?.values.at(-1)??null,hotDelta:delta(h?.values.at(-1),ph?.values.at(-1)),rankDelta:pr?pr.rank-s.rank:null,dailyListeners:null}});
 return {top,hot,listeners,predictionRounds:rounds,review,status:null,now:at,transport:'github-pages-history'};
}
