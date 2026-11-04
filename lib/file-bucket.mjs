import fs from 'node:fs/promises';
import path from 'node:path';
export class FileBucket{
 constructor(root){this.root=path.resolve(root)}
 filename(key){
  if(typeof key!=='string'||!/^([a-z]+\/)?[A-Za-z0-9T:_.-]+\.json$/.test(key)||key.includes('..'))throw Error('Invalid record key');
  const name=path.resolve(this.root,key.replaceAll(':','-'));if(!name.startsWith(this.root+path.sep))throw Error('Invalid record path');return name;
 }
 async get(key){try{const raw=await fs.readFile(this.filename(key),'utf8');return {json:async()=>JSON.parse(raw)}}catch(e){if(e.code==='ENOENT')return null;throw e}}
 async put(key,value){const file=this.filename(key);await fs.mkdir(path.dirname(file),{recursive:true});const temporary=file+'.tmp-'+process.pid;await fs.writeFile(temporary,value);await fs.rename(temporary,file)}
 async list({prefix='',limit=300}={}){const all=await this.records();const objects=all.filter(o=>o.key.startsWith(prefix)).sort((a,b)=>a.key.localeCompare(b.key));return {objects:objects.slice(0,limit),truncated:objects.length>limit}}
 async records(){let output=[];let entries=[];try{entries=await fs.readdir(this.root,{withFileTypes:true})}catch(e){if(e.code==='ENOENT')return [];throw e}
  for(const e of entries){if(!e.isDirectory()||!['top','hot','listeners','predictions','reviews'].includes(e.name))continue;for(const f of await fs.readdir(path.join(this.root,e.name))){if(!/^\d{4}-\d{2}-\d{2}(T\d{2}-\d{2})?\.json$/.test(f))continue;const key=e.name+'/'+f.replace(/T(\d{2})-(\d{2})/, 'T$1:$2');const stat=await fs.stat(path.join(this.root,e.name,f));output.push({key,size:stat.size})}}
  return output;
 }
}
