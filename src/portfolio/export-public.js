import {existsSync,mkdirSync,readdirSync,rmdirSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {basename,dirname,join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {durableAppend} from '../durable.js';
import {digest,sourceIdentity} from '../source-identity.js';
import {EXPORT_VERSION,DEFAULT_HOST_ROOT,canonicalPath,hostIndexPath,loadLedger,regenerateWorld,publicWorld,publicBytes,loadPublicDirectory} from './challenge-public.js';

export function writePublicWorld(file,world){writeFileSync(file,publicBytes(world),{flag:'wx'});}
export function exportPublic(ledgerFiles,{out,hostRoot=DEFAULT_HOST_ROOT,onProgress=null}={}){
  if(!out)throw new Error('public output directory is required');
  const paths=Array.isArray(ledgerFiles)?ledgerFiles:[ledgerFiles];
  if(!paths.length||paths.some(p=>typeof p!=='string'||!p))throw new Error('at least one construction ledger is required');
  const ledgers=paths.map(p=>loadLedger(p)),output=resolve(out),indexPath=hostIndexPath(output,hostRoot);
  if(new Set(ledgers.map(l=>canonicalPath(l.path))).size!==ledgers.length)throw new Error('duplicate construction ledger');
  const identities=ledgers.map(l=>({path:l.path,hash:l.hash,constructionSourceHash:l.header.sourceHash}));
  if(existsSync(indexPath)){
    const prior=loadPublicDirectory(output,{hostRoot});
    if(JSON.stringify(prior.index.ledgers)!==JSON.stringify(identities))throw new Error('output already belongs to another construction assignment');
    return {out:output,worlds:prior.worlds.length,idempotent:true};
  }
  if(existsSync(output)&&readdirSync(output).length)throw new Error('public output directory must be empty or a verified previous export');
  const count=ledgers.reduce((n,l)=>n+l.entries.filter(e=>e.constructionValid).length,0);
  if(!count)throw new Error('construction assignment has no accepted worlds');
  mkdirSync(dirname(output),{recursive:true});
  const stage=join(dirname(output),basename(output)+'.pending-'+randomBytes(16).toString('hex'));
  mkdirSync(stage);const sourceHash=sourceIdentity(),worlds=[];
  let published=false;
  try{
    for(const [ledger,l]of ledgers.entries())for(const entry of l.entries.filter(e=>e.constructionValid)){
      const world=publicWorld(regenerateWorld(l,entry)),file=`world-${String(worlds.length+1).padStart(6,'0')}-${entry.worldDigest}.json`;
      writePublicWorld(join(stage,file),world);
      worlds.push({file,ledger,proposalIndex:entry.index,worldDigest:entry.worldDigest,publicHash:digest(publicBytes(world))});
      onProgress?.({completed:worlds.length,total:count});
    }
    if(sourceHash!==sourceIdentity()||ledgers.some(l=>loadLedger(l.path).hash!==l.hash))throw new Error('host evidence changed during export');
    if(existsSync(output))rmdirSync(output); // Only the verified empty destination; never recursive.
    renameSync(stage,output);published=true;
    mkdirSync(dirname(indexPath),{recursive:true});
    durableAppend(indexPath,{type:'challenge-host-index',version:2,exportVersion:EXPORT_VERSION,publicDirectory:canonicalPath(output),sourceHash,ledgers:identities,worlds},{exclusive:true});
    return {out:output,worlds:worlds.length,idempotent:false};
  }finally{
    // stage is the exact random sibling allocated above; never delete a caller-supplied tree.
    if(!published&&existsSync(stage)&&dirname(resolve(stage))===dirname(output)&&basename(stage).startsWith(basename(output)+'.pending-'))rmSync(stage,{recursive:true});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const ledgers=[],options={};
    for(let i=2;i<process.argv.length;i++){const arg=process.argv[i];if(arg==='--out'||arg==='--host-root'){const value=process.argv[++i];if(!value||value.startsWith('--'))throw new Error('missing value for '+arg);options[arg==='--out'?'out':'hostRoot']=value;}else if(arg.startsWith('--'))throw new Error('unknown option '+arg);else ledgers.push(arg);}
    console.log(JSON.stringify(exportPublic(ledgers,options)));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
