import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {nextCollectionTime,continueCollection} from '../scripts/continue-collection.mjs';
import {describeCollection} from '../docs/freshness.js';

const at = value => Date.parse('2026-11-04T' + value + '+09:00');
const complete = {
  status: {attemptedAt: '2026-11-04T16:05', errorCount: 0},
  top: {sourceAt: '2026-11-04T16:00'},
  hot: {sourceAt: '2026-11-04T16:05'},
  listeners: {sourceAt: '2026-11-04T16:00'},
};

test('automatic continuation aligns with source slots, including midnight, without a real wait', async () => {
  assert.equal(nextCollectionTime(at('16:01:00')), at('16:05:12'));
  assert.equal(nextCollectionTime(at('16:05:11')), at('16:05:12'));
  assert.equal(nextCollectionTime(at('16:05:13')), at('16:10:12'));
  assert.equal(nextCollectionTime(at('23:59:59')), Date.parse('2026-11-05T00:00:12+09:00'));
  let now = at('16:01:00');
  const waits = [], calls = [];
  const result = await continueCollection({
    token: 'fixture-only', repository: 'owner/chart', now: () => now,
    sleep: async ms => {waits.push(ms); now += ms;}, log: () => {},
    fetcher: async (url, options) => {calls.push({url,options,now}); return new Response(null,{status:204});},
  });
  assert.equal(result.target, at('16:05:12'));
  assert.ok(waits.every(ms => ms > 0 && ms <= 30_000));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].now, result.target);
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/chart/actions/workflows/collect-and-deploy.yml/dispatches');
  assert.deepEqual(JSON.parse(calls[0].options.body), {ref:'main'});
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-only');
});

test('transient dispatch failures retry, rejected permissions stop, and request secrets are not logged', async () => {
  const logs = [];
  let now = at('16:05:11'), calls = 0;
  await continueCollection({
    token: 'fixture-only', repository: 'owner/chart', now: () => now,
    sleep: async ms => {now += ms;}, log: line => logs.push(line),
    fetcher: async () => {calls++; if(calls===1) throw Error('fixture-only'); return new Response(null,{status:calls===2?503:204});},
  });
  assert.equal(calls, 3);
  assert.ok(!logs.join('\n').includes('fixture-only'));
  calls = 0;
  await assert.rejects(continueCollection({
    token: 'fixture-only', repository: 'owner/chart', now: () => now,
    sleep: async ms => {now += ms;}, log: line => logs.push(line),
    fetcher: async () => {calls++; return new Response('fixture-only',{status:403});},
  }), error => error.message.includes('HTTP 403') && !error.message.includes('fixture-only'));
  assert.equal(calls, 1);
  await assert.rejects(continueCollection({token:'fixture-only',repository:'https://other.invalid',fetcher:async()=>{throw Error('must not call')}}), /configuration/);
});

test('dashboard distinguishes a stopped collector, fresh source failures and normal collection', () => {
  assert.equal(describeCollection(complete,at('16:07:00')).level, 'current');
  const stopped={...complete,status:{attemptedAt:'2026-11-04T15:58',errorCount:0}};
  const delayed=describeCollection(stopped,at('16:06:30'));
  assert.equal(delayed.level,'delayed');
  assert.ok(delayed.details.includes('마지막 수집 시도'));
  const pending={...complete,hot:{sourceAt:'2026-11-04T15:55'},status:{...complete.status,errorCount:1}};
  assert.equal(describeCollection(pending,at('16:07:30')).level,'partial');
  assert.ok(describeCollection(pending,at('16:07:30')).details.includes('HOT100'));
  assert.equal(describeCollection({...complete,hot:{sourceAt:'invalid'}},at('16:07:30')).level,'partial');
  assert.equal(describeCollection({},at('16:07:00')).level,'waiting');
});

test('policy links stay in the project path, use real contact routes and disclose third-party processing',async()=>{
  const home='https://example.github.io/melon-chart-observatory/';
  const files=['index.html','terms/index.html','privacy/index.html','sources/index.html'];
  for(const file of files){
    const html=await fs.readFile(new URL('../docs/'+file,import.meta.url),'utf8');
    assert.ok(html.includes('content="no-referrer"'));
    for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
      if(href.startsWith('https://'))continue;
      assert.ok(new URL(href,home+file).pathname.startsWith('/melon-chart-observatory/'),href+' escapes the project');
    }
  }
  const privacy=await fs.readFile(new URL('../docs/privacy/index.html',import.meta.url),'utf8');
  const terms=await fs.readFile(new URL('../docs/terms/index.html',import.meta.url),'utf8');
  assert.ok(privacy.includes('IP 주소'));
  assert.ok(privacy.includes('검색어를 운영자에게 전송하거나 저장하지 않습니다'));
  assert.ok(privacy.includes('https://github.com/ISD-melonchart/melon-chart-observatory/issues'));
  assert.ok(terms.includes('복제·배포·상업적 이용 허락'));
  assert.ok(!terms.includes('김은수'));
});
