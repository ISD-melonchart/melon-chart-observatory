import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker from '../lib/collector-worker.mjs';
import {FileBucket} from '../lib/file-bucket.mjs';
if(!process.argv[2])throw Error('Usage: node scripts/import-snapshot.mjs PATH_TO_STATE_JSON');
const snapshot=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const bucket=new FileBucket(fileURLToPath(new URL('../docs/data/',import.meta.url)));
for(const kind of ['top','hot','listeners'])if(snapshot[kind]?.sourceAt){const value=JSON.stringify(snapshot[kind]);await bucket.put(kind+'/latest.json',value);await bucket.put(kind+'/'+snapshot[kind].sourceAt+'.json',value)}
for(const round of snapshot.predictionRounds||[])if(round.rows?.length)await bucket.put('predictions/'+round.sourceAt+'.json',JSON.stringify(round));
if(snapshot.status)await bucket.put('status.json',JSON.stringify(snapshot.status));
const response=await worker.fetch(new Request('https://import.local/api/state'),{BUCKET:bucket});
if(!response.ok)throw Error('Snapshot validation failed');
const state=await response.json();state.exportedAt=new Date().toISOString();state.transport='imported-confirmed-site-snapshot';
await bucket.put('state.json',JSON.stringify(state));
const records=await bucket.records();await bucket.put('history-index.json',JSON.stringify({generatedAt:state.exportedAt,records:records.map(o=>({...o,sourceAt:o.key.split('/')[1].replace('.json',''),kind:o.key.split('/')[0]}))}));
console.log('Imported confirmed snapshot. Original source timestamps retained.');
