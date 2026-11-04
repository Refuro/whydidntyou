import {readdirSync,readFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const digest=text=>createHash('sha256').update(text).digest('hex');
export const stateDigest=records=>digest(records.map(JSON.stringify).join('\n')+'\n');
export function sourceIdentity(){
  const root=fileURLToPath(new URL('..',import.meta.url)),files=[];
  const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())walk(path);else if(entry.name.endsWith('.js'))files.push(path);}};
  walk(join(root,'src'));files.push(join(root,'package.json'),join(root,'package-lock.json'));
  return digest(JSON.stringify(files.sort().map(p=>[relative(root,p).replaceAll('\\','/'),digest(readFileSync(p))])));
}
export function validateResumeIdentity(header){
  if(header.resumeVersion!==1)throw new Error('batch has no registered resume manifest');
  if(header.sourceHash!==sourceIdentity())throw new Error('batch source hash differs from current source');
  if(header.configHash!==digest(JSON.stringify(header.config)))throw new Error('batch config hash mismatch');
}
