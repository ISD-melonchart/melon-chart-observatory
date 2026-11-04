import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../docs/',import.meta.url));
const p=process.argv.indexOf('--port');const port=Number(process.env.PORT||(p>=0?process.argv[p+1]:3000));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);if(file!==path.resolve(root)&&!file.startsWith(root))throw Error('Invalid path');if((await fs.stat(file)).isDirectory()){if(!pathname.endsWith('/')){res.writeHead(302,{location:pathname+'/'});res.end();return}file=path.join(file,'index.html')}const bytes=await fs.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'0.0.0.0',()=>console.log('Public preview ready on '+port));
