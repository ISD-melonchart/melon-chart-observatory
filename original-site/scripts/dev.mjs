import http from 'node:http';
import worker from '../worker/index.js';
const values=new Map();const env={BUCKET:{async get(k){let v=values.get(k);return v?{json:async()=>JSON.parse(v)}:null},async put(k,v){values.set(k,v)},async list({prefix,limit=300}){return {objects:[...values.keys()].filter(k=>k.startsWith(prefix)).sort().slice(0,limit).map(key=>({key,size:values.get(key).length})),truncated:false}}}};
const pi=process.argv.indexOf('--port');const port=Number(process.env.PORT||(pi>=0?process.argv[pi+1]:3000));
http.createServer(async(req,res)=>{try{let r=await worker.fetch(new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers}),env,{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch(e){res.writeHead(500);res.end(e.message)}}).listen(port,'0.0.0.0',()=>console.log('Preview ready '+port));
