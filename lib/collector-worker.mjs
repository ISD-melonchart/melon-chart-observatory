const KST=9*3600000;
const stamp=(t=Date.now())=>new Date(t+KST).toISOString().slice(0,16);
const slot=(minutes,t=Date.now())=>stamp(Math.floor(t/(minutes*60000))*minutes*60000);
const json=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store'}});
async function get(env,key){const o=await env.BUCKET.get(key);return o?o.json():null}
async function put(env,key,v){await env.BUCKET.put(key,JSON.stringify(v),{httpMetadata:{contentType:'application/json'}})}
async function upstream(url){const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json,text/html','Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('멜론 응답 HTTP '+r.status);return r}
const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
export function parseTop(html){
 const date=html.match(/class="year"[^>]*>\s*(\d{4}\.\d{2}\.\d{2})/),hour=html.match(/class="hour"[^>]*>\s*(\d{2}:00)/);
 if(!date||!hour)throw Error('TOP100 기준 시각 확인 실패');
 const rows=[...html.matchAll(/<tr[^>]*data-song-no="(\d+)"[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>{const h=m[2],part=c=>h.match(new RegExp('class="[^"\\n]*'+c+'[^"\\n]*"[^>]*>([\\s\\S]*?)<\\/div>'))?.[1]||'';return {songId:m[1],rank:Number(h.match(/class="rank\s*"[^>]*>\s*(\d+)/)?.[1]),title:clean(part('rank01').match(/<a[^>]*>([\s\S]*?)<\/a>/)?.[1]||''),artist:clean(part('rank02').match(/<a[^>]*>([\s\S]*?)<\/a>/)?.[1]||''),image:h.match(/<img[^>]+src="([^"]+)"/)?.[1]?.replaceAll('&amp;','&')||''}});
 if(rows.length!==100||new Set(rows.map(r=>r.songId)).size!==100||rows.some(r=>!r.title)||rows.map(r=>r.rank).sort((a,b)=>a-b).some((r,i)=>r!==i+1))throw Error('TOP100 전체 100곡 검증 실패: rows='+rows.length+', titles='+rows.filter(r=>r.title).length+', ranks='+rows.slice(0,3).map(r=>r.rank).join(','));
 return {sourceAt:date[1].replaceAll('.','-')+'T'+hour[1],rows:rows.sort((a,b)=>a.rank-b.rank),receivedAt:stamp()};
}
export function parseHot(payload){const d=payload.response;if(!d||String(d.STATUS)!=='0'||![false,'false','N',0].includes(d.FIVEERRORFLAG))throw Error('HOT100 그래프 제공 대기');const sourceAt=d.RANKDAY.replaceAll('.','-')+'T'+d.RANKHOUR;const age=Date.now()-Date.parse(sourceAt+':00+09:00');if(age<0||age>=600000)throw Error('HOT100 기준 시각 지연');const labels=d.XCATE;if(!Array.isArray(labels)||labels.at(-1)!==d.RANKHOUR)throw Error('HOT100 시간축 오류');const series=d.GRAPHDATALIST.map(s=>{let values=Array(labels.length).fill(null);for(const p of s.GRAPHDATA){if(!Number.isInteger(Number(p.X))||p.X<0||p.X>=values.length)throw Error('그래프 좌표 오류');if(p.VAL!==''&&p.VAL!=null){let v=Number(p.VAL);if(!Number.isFinite(v)||v<0)throw Error('그래프 값 오류');values[p.X]=v}}return {songId:String(s.SONGID),title:s.GRAPHCHARTINFO.SONGNAME,rank:Number(s.GRAPHCHARTINFO.CURRANK),values}});if(series.length!==5)throw Error('HOT100 상위 5곡 미완료');return {sourceAt,labels,series,receivedAt:stamp()}}
const PREDICTION_MINUTES=[30,40,50];
const rankNumber=value=>{
 if(typeof value==='boolean'||value==null)return null;
 const text=String(value).trim().replace(/위$/,'').trim();
 if(!/^\d+$/.test(text))return null;
 const n=Number(text);return n>=1&&n<=100?n:null;
};
const nextHour=sourceAt=>slot(60,Date.parse(sourceAt+':00+09:00')+3600000);

// A forecast is the point labelled "예측", never CURRANK or the first
// PREDICTEDDATA entry (which anchors the current official rank).
export function parsePrediction(payload,songId,target,dateHeader,receivedAt=Date.now()){
 const d=payload?.response;
 if(!PREDICTION_MINUTES.includes(Number(target.slice(14,16))))throw Error('예측 회차 오류');
 if(String(d?.RESULTCODE)!=='0'||String(d?.SONGINFO?.SONGID)!==songId)throw Error('예측 곡 ID 확인 실패');
 const sourceMs=Date.parse(target+':00+09:00'),serverMs=Date.parse(dateHeader);
 if(!Number.isFinite(serverMs)||Math.abs(receivedAt-serverMs)>45000||serverMs<sourceMs||serverMs>=sourceMs+600000)throw Error('예측 응답 날짜·시각 확인 실패');
 if(d.RECENTTIME!==target.slice(11))throw Error('예측 기준 시각 갱신 대기');
 const chart=d.RANKCHART,labels=chart?.XLABELS,points=chart?.DATA,predicted=chart?.PREDICTEDDATA;
 if(!Array.isArray(labels)||!Array.isArray(points))throw Error('예측 그래프 형식 오류');
 const current=labels.flatMap((l,i)=>l?.XLABEL==='현재'?[i]:[]);
 const future=labels.flatMap((l,i)=>l?.XLABEL==='예측'?[i]:[]);
 const actual=rankNumber(d.SONGINFO.CURRANK);
 if(current.length!==1||actual==null)throw Error('현재 순위 검증 대기');
 const ci=current[0],cp=points.filter(p=>p?.XINDEX!=null&&Number(p.XINDEX)===ci);
 const previousHour=/^(\d{1,2})시$/.exec(String(labels[ci-1]?.XLABEL||''));
 if(cp.length!==1||rankNumber(cp[0].VALUE)!==actual||!previousHour||Number(previousHour[1])!==(Number(target.slice(11,13))+23)%24)throw Error('현재 시각·순위 그래프 검증 대기');
 if(future.length!==1||future[0]!==ci+1||!Array.isArray(predicted)||!String(chart.TITLE?.TEXT||'').includes('예측'))return null;
 const anchor=predicted.filter(p=>p?.XINDEX!=null&&Number(p.XINDEX)===ci);
 const forecast=predicted.filter(p=>p?.XINDEX!=null&&Number(p.XINDEX)===future[0]);
 const rank=rankNumber(chart.TITLE?.VALUE);
 if(anchor.length!==1||rankNumber(anchor[0].VALUE)!==actual||forecast.length!==1||rank==null||rankNumber(forecast[0].VALUE)!==rank)return null;
 return {songId,rank,actualRank:actual,sourceAt:target,targetAt:nextHour(target),receivedAt:stamp(receivedAt)};
}

async function collect(env){
 const errors=[];
 const save=async(kind,data)=>{await put(env,kind+'/'+data.sourceAt+'.json',data);await put(env,kind+'/latest.json',data)};
 let top=await get(env,'top/latest.json');
 if(top?.sourceAt!==slot(60))try{
  const v=parseTop(await (await upstream('https://www.melon.com/chart/index.htm')).text());
  if(v.sourceAt!==slot(60))throw Error('TOP100 정각 갱신 대기');
  await save('top',v);top=v;
 }catch(e){errors.push('TOP100: '+e.message)}
 const hot=await get(env,'hot/latest.json');
 if(hot?.sourceAt!==slot(5))try{
  const v=parseHot(await (await upstream('https://m2.melon.com/m6/chart/hour/five/graph.json?v=4.0&minute='+new Date(Date.now()+KST).getUTCMinutes())).json());
  await save('hot',v);
 }catch(e){errors.push('HOT100: '+e.message)}
 let predictionStatus=null;
 if(top?.rows&&top.sourceAt===slot(60)){
  const target=slot(10),predictionDue=PREDICTION_MINUTES.includes(Number(target.slice(14,16)));
  const [oldListeners,oldPredictions]=await Promise.all([get(env,'listeners/'+target+'.json'),predictionDue?get(env,'predictions/'+target+'.json'):null]);
  const listeners=new Map((oldListeners?.rows||[]).map(r=>[r.songId,r]));
  const predictions=new Map((oldPredictions?.rows||[]).map(r=>[r.songId,r]));
  const needListeners=top.rows.some(s=>!listeners.has(s.songId));
  const needPredictions=predictionDue&&top.rows.some(s=>!predictions.has(s.songId));
  // Even if all listener counts were already saved, collect missing forecasts.
  const ids=top.rows.filter(s=>!listeners.has(s.songId)||(predictionDue&&!predictions.has(s.songId)));
  for(let i=0;i<ids.length;i+=5){
   await Promise.all(ids.slice(i,i+5).map(async s=>{
    const wantListener=!listeners.has(s.songId),wantPrediction=predictionDue&&!predictions.has(s.songId);
    try{
     const response=await upstream('https://m2.melon.com/m6/chart/song/chartReport.json?appVer=6.6.2.1&songId='+s.songId);
     const payload=await response.json(),d=payload?.response;
     if(String(d?.RESULTCODE)!=='0'||String(d?.SONGINFO?.SONGID)!==s.songId||d.RECENTTIME!==target.slice(11))throw Error('곡·기준 시각 갱신 대기');
     if(wantListener){
      const value=d?.LISTENERCHART?.TITLE?.VALUE;
      if(/^\d[\d,]*$/.test(String(value)))listeners.set(s.songId,{songId:s.songId,value:Number(String(value).replaceAll(',','')),sourceAt:target});
      else errors.push('감상자수 '+s.songId+': 수치 확인 실패');
     }
     if(wantPrediction){
      try{const row=parsePrediction(payload,s.songId,target,response.headers.get('date'));
       if(row)predictions.set(s.songId,row);else errors.push('예측 '+s.songId+': 미제공 또는 갱신 대기');
      }catch(e){errors.push('예측 '+s.songId+': '+e.message)}
     }
    }catch(e){errors.push(s.songId+': '+e.message)}
   }));
  }
  if(needListeners)await save('listeners',{sourceAt:target,receivedAt:stamp(),rows:[...listeners.values()],expected:100});
  if(needPredictions)await put(env,'predictions/'+target+'.json',{sourceAt:target,targetAt:nextHour(target),receivedAt:stamp(),rows:[...predictions.values()],expected:100});
  if(predictionDue)predictionStatus={sourceAt:target,collected:predictions.size,expected:100};
 }
 const result={attemptedAt:stamp(),predictions:predictionStatus,errors:errors.slice(0,12),errorCount:errors.length};
 await put(env,'status.json',result);return result;
}

async function predictionRounds(env,at){
 const viewedAt=at||stamp(),viewedMs=at?Date.parse(at+':00+09:00'):Date.now();
 return Promise.all(PREDICTION_MINUTES.map(async minute=>{
  const sourceAt=viewedAt.slice(0,14)+minute,targetAt=nextHour(sourceAt);
  const sourceMs=Date.parse(sourceAt+':00+09:00');
  // A historical view must not reveal later predictions in that hour.
  const due=sourceMs<=viewedMs,saved=due?await get(env,'predictions/'+sourceAt+'.json'):null;
  return {minute,sourceAt,targetAt,rows:saved?.rows||[],expected:saved?.expected||100,receivedAt:saved?.receivedAt||null,closed:viewedMs>=sourceMs+600000,
   status:!due?'scheduled':saved?.rows?.length===100?'complete':saved?.rows?.length?'partial':viewedMs<sourceMs+600000?'pending':'missing'};
 }));
}
export function delta(a,b){return typeof a==='number'&&typeof b==='number'?{value:a-b,percent:b===0?null:(a-b)/b*100}:null}
async function state(env,at=null){const file=(kind,m)=>at?kind+'/'+slot(m,Date.parse(at+':00+09:00'))+'.json':kind+'/latest.json';const [top,hot,listeners,status]=await Promise.all([file('top',60),file('hot',5),file('listeners',10),'status.json'].map(k=>get(env,k)));const rounds=await predictionRounds(env,at);const prevTime=t=>stamp(Date.parse(t+':00+09:00')-86400000);const prevHot=hot?await get(env,'hot/'+prevTime(hot.sourceAt)+'.json'):null;const prevListeners=listeners?await get(env,'listeners/'+prevTime(listeners.sourceAt)+'.json'):null;const prevTop=top?await get(env,'top/'+prevTime(top.sourceAt)+'.json'):null;
 const review=(top?.rows||[]).map(s=>{let l=listeners?.rows.find(r=>r.songId===s.songId),pl=prevListeners?.rows.find(r=>r.songId===s.songId),h=hot?.series.find(r=>r.songId===s.songId),ph=prevHot?.series.find(r=>r.songId===s.songId);return {...s,predictions:Object.fromEntries(rounds.map(round=>[round.minute,round.rows.find(r=>r.songId===s.songId)||null])),listeners:l?.value??null,listenerDelta:delta(l?.value,pl?.value),hotValue:h?.values.at(-1)??null,hotDelta:delta(h?.values.at(-1),ph?.values.at(-1)),rankDelta:prevTop?.rows.find(r=>r.songId===s.songId)?.rank-s.rank||null,dailyListeners:null}});
 if(top&&!at){const day=stamp().slice(0,10),key='reviews/'+day+'.json';if(!await get(env,key))await put(env,key,{createdAt:stamp(),review})}
 return {top,hot,listeners,status,review,predictionRounds:rounds,now:stamp(),notice:'30·40·50분 예측은 다음 정각 TOP100의 예상 순위이며 각 회차 원본을 따로 저장합니다. HOT100은 멜론이 제공하는 상위 5곡 그래프 수치입니다. 10분 감상자수의 합계는 일간 순감상자수가 아닙니다. 일간 감상자수 원본 연결 전에는 해당 비교를 제공하지 않습니다.'}}
export default {async fetch(request,env){const u=new URL(request.url);try{if(u.pathname==='/api/history'){const kind=u.searchParams.get('kind')||'top',date=u.searchParams.get('date')||stamp().slice(0,10);if(!['top','hot','listeners','predictions','reviews'].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(date))return json({error:'잘못된 기록 조건'},400);const result=await env.BUCKET.list({prefix:kind+'/'+date,limit:300});return json({records:result.objects.map(o=>({key:o.key,sourceAt:o.key.split('/')[1].replace('.json',''),bytes:o.size})),truncated:result.truncated})}if(u.pathname==='/api/state'){const at=u.searchParams.get('at');if(at&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at))return json({error:'잘못된 시각'},400);return json(await state(env,at))}if(u.pathname==='/api/update'&&request.method==='POST'){if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Forbidden'},403);return json(await collect(env))}if(u.pathname==='/api/export')return json(await state(env));if(u.pathname!=='/')return new Response('Not found',{status:404});return new Response(page,{headers:{'content-type':'text/html; charset=utf-8'}})}catch(e){return json({error:e.message},500)}}};
const page='';
