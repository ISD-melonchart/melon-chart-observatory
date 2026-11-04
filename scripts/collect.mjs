import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker from '../lib/collector-worker.mjs';
import {FileBucket} from '../lib/file-bucket.mjs';
export async function collectAndExport(root,{retry=true}={}){
 const bucket=new FileBucket(root),env={BUCKET:bucket};
 const run=async()=>{const response=await worker.fetch(new Request('https://collector.local/api/update',{method:'POST'}),env);if(!response.ok)throw Error('Collector failed: HTTP '+response.status);return response.json()};
 let result=await run();
 if(retry&&result.errorCount>0&&!result.errors.some(e=>/HTTP (4\d\d)/.test(e))){await new Promise(r=>setTimeout(r,5000));result=await run()}
 const response=await worker.fetch(new Request('https://collector.local/api/state'),env);if(!response.ok)throw Error('State export failed: HTTP '+response.status);
 const state=await response.json();state.exportedAt=new Date().toISOString();state.transport='github-actions';
 await bucket.put('state.json',JSON.stringify(state));
 const records=await bucket.records();await bucket.put('history-index.json',JSON.stringify({generatedAt:state.exportedAt,records:records.map(o=>({...o,sourceAt:o.key.split('/')[1].replace('.json',''),kind:o.key.split('/')[0]}))}));
 return {result,counts:{top:state.top?.rows.length||0,listeners:state.listeners?.rows.length||0,hot:state.hot?.series.length||0},sourceAt:{top:state.top?.sourceAt||null,hot:state.hot?.sourceAt||null,listeners:state.listeners?.sourceAt||null}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=fileURLToPath(new URL('../docs/data/',import.meta.url));
 try{const result=await collectAndExport(root);console.log(JSON.stringify(result,null,2));if(result.result.errorCount)console.warn('Some source data is unavailable; last confirmed values were retained.')}catch(e){console.error(e.message);process.exitCode=1}
}
