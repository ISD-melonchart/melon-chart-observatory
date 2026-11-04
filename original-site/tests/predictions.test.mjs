import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{parsePrediction} from '../worker/index.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/melon-prediction.json',import.meta.url),'utf8'));
const payload=()=>structuredClone(fixture);
const target='2026-10-22T20:50';
const now=Date.parse(target+':03+09:00');
const date=new Date(now).toUTCString();
const sid=fixture.response.SONGINFO.SONGID;
function parse(p=payload(),at=target,ms=now){return parsePrediction(p,sid,at,new Date(ms).toUTCString(),ms)}
function memory(initial={}){
 const values=new Map(Object.entries(initial)),writes=[];
 const env={BUCKET:{async get(k){return values.has(k)?{json:async()=>structuredClone(values.get(k))}:null},async put(k,v){values.set(k,JSON.parse(v));writes.push(k)},async list({prefix}){return {objects:[...values.keys()].filter(k=>k.startsWith(prefix)).sort().map(key=>({key,size:1})),truncated:false}}}};
 return {env,values,writes};
}

test('the forecast point is 52, not current rank 44 or its anchor',()=>{
 const row=parse();assert.equal(row.rank,52);assert.equal(row.actualRank,44);assert.equal(row.sourceAt,target);assert.equal(row.targetAt,'2026-10-22T21:00');
});

test('30/40/50 are distinct source rounds with the same next-hour target',()=>{
 for(const minute of [30,40,50]){const p=payload(),at='2026-10-22T20:'+minute;p.response.RECENTTIME='20:'+minute;const row=parse(p,at,Date.parse(at+':05+09:00'));assert.equal(row.sourceAt,at);assert.equal(row.targetAt,'2026-10-22T21:00')}
});

test('missing, inconsistent and duplicate forecasts never fall back to actual rank',()=>{
 for(const mode of ['absent','current-title','anchor','point','duplicate','title','out-of-range']){
  const p=payload(),c=p.response.RANKCHART;
  if(mode==='absent')delete c.PREDICTEDDATA;
  if(mode==='current-title')c.TITLE.TEXT='현재 순위는 ##VALUE##입니다.';
  if(mode==='anchor')c.PREDICTEDDATA[0].VALUE=1;
  if(mode==='point')c.PREDICTEDDATA[1].VALUE=53;
  if(mode==='duplicate')c.PREDICTEDDATA.push(structuredClone(c.PREDICTEDDATA[1]));
  if(mode==='title')c.TITLE.VALUE='55위';
  if(mode==='out-of-range'){c.TITLE.VALUE='101위';c.PREDICTEDDATA[1].VALUE=101}
  assert.equal(parse(p),null,mode);
 }
});

test('wrong song, old slot/date, future HTTP date and bad current-hour graph are rejected',()=>{
 const changes=[p=>p.response.SONGINFO.SONGID='1',p=>p.response.RECENTTIME='20:40',p=>p.response.RANKCHART.XLABELS[5].XLABEL='18시',p=>p.response.RANKCHART.DATA[6].VALUE=99];
 for(const change of changes){const p=payload();change(p);assert.throws(()=>parse(p))}
 assert.throws(()=>parsePrediction(payload(),sid,target,'Wed, 21 Oct 2026 11:50:03 GMT',now));
 assert.throws(()=>parsePrediction(payload(),sid,target,new Date(now+60000).toUTCString(),now));
 assert.throws(()=>parsePrediction(payload(),sid,target,null,now));
});

test('midnight forecast target rolls into the next date',()=>{
 const p=payload(),at='2026-10-22T23:50';p.response.RECENTTIME='23:50';p.response.RANKCHART.XLABELS[5].XLABEL='22시';
 assert.equal(parse(p,at,Date.parse(at+':05+09:00')).targetAt,'2026-10-23T00:00');
});

test('history exposes each round separately and never reveals future rounds',async()=>{
 const initial={'top/2026-10-22T20:00.json':{sourceAt:'2026-10-22T20:00',rows:[{songId:sid,rank:44,title:'fixture',artist:'artist'}]}};
 for(const minute of [30,40,50]){const at='2026-10-22T20:'+minute;initial['predictions/'+at+'.json']={sourceAt:at,rows:[{songId:sid,rank:minute,sourceAt:at,targetAt:'2026-10-22T21:00'}],expected:100}}
 const {env,writes}=memory(initial);
 const response=await worker.fetch(new Request('https://test/api/state?at=2026-10-22T20:35'),env),data=await response.json();
 assert.equal(data.review[0].predictions[30].rank,30);assert.equal(data.review[0].predictions[40],null);assert.equal(data.review[0].predictions[50],null);assert.equal(data.predictionRounds[1].status,'scheduled');assert.equal(writes.length,0);
 const later=await (await worker.fetch(new Request('https://test/api/state?at=2026-10-22T20:55'),env)).json();
 assert.deepEqual([30,40,50].map(m=>later.review[0].predictions[m].rank),[30,40,50]);
 const history=await (await worker.fetch(new Request('https://test/api/history?kind=predictions&date=2026-10-22'),env)).json();assert.equal(history.records.length,3);
 const next=await (await worker.fetch(new Request('https://test/api/state?at=2026-10-22T21:05'),env)).json();assert.ok(next.predictionRounds.every(r=>r.rows.length===0));
});

test('collector fetches forecasts with listeners already complete, keeps rounds, retries only missing songs',async t=>{
 let ms=Date.parse('2026-10-22T20:30:05+09:00'),calls=0,failed=true;
 t.mock.method(Date,'now',()=>ms);
 const rows=Array.from({length:100},(_,i)=>({songId:String(1000+i),rank:i+1,title:'fixture '+i,artist:'artist'}));
 const {env,values,writes}=memory({'top/latest.json':{sourceAt:'2026-10-22T20:00',rows},'hot/latest.json':{sourceAt:'2026-10-22T20:30'},'listeners/2026-10-22T20:30.json':{sourceAt:'2026-10-22T20:30',rows:rows.map(r=>({songId:r.songId,value:500}))}});
 t.mock.method(globalThis,'fetch',async url=>{
  calls++;const id=new URL(url).searchParams.get('songId');assert.ok(id,'only report requests expected');
  if(id==='1000'&&failed){failed=false;throw Error('one transient report error')}
  const p=payload(),d=p.response,at=new Date(ms+9*3600000).toISOString().slice(0,16);
  d.RECENTTIME=at.slice(11);d.SONGINFO.SONGID=id;d.LISTENERCHART.TITLE.VALUE='732';
  return Response.json(p,{headers:{Date:new Date(ms).toUTCString()}});
 });
 const run=async()=>{const r=await worker.fetch(new Request('https://test/api/update',{method:'POST'}),env);assert.equal(r.status,200);return r.json()};
 let result=await run();assert.equal(result.predictions.collected,99);assert.equal(calls,100);assert.ok(!writes.includes('listeners/2026-10-22T20:30.json'),'complete listeners must not prevent forecasts or be rewritten');
 await run();assert.equal(calls,101);assert.equal(values.get('predictions/2026-10-22T20:30.json').rows.length,100);
 await run();assert.equal(calls,101,'complete round is deduplicated');
 ms=Date.parse('2026-10-22T20:40:05+09:00');values.set('hot/latest.json',{sourceAt:'2026-10-22T20:40'});
 await run();assert.equal(calls,201);assert.equal(values.get('predictions/2026-10-22T20:30.json').sourceAt,'2026-10-22T20:30');assert.equal(values.get('predictions/2026-10-22T20:40.json').rows.length,100);assert.equal(values.get('listeners/2026-10-22T20:40.json').rows.length,100);
});

test('page contains three labelled columns and its script parses',async()=>{
 const page=await (await worker.fetch(new Request('https://test/'),{})).text();
 for(const m of [30,40,50])assert.ok(page.includes(m+'분 예측'));
 assert.doesNotThrow(()=>new Function(page.match(/<script>([\s\S]*?)<\/script>/)[1]));
});
