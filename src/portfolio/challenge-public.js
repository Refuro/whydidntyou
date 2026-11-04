// Public schema and host-only ledger binding shared by the challenge adapters.
// Nothing from the private index is included in a solver's input.
import {existsSync,lstatSync,readdirSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve,relative,isAbsolute,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {make,publicEvidence} from '../domains/invariantGame.js';
import {constructSealed} from '../sealed-sampler.js';
import {constructionSummary,sealWorld} from '../construction-ledger.js';
import {checkWorld} from '../check-invariant-world.js';
import {readRecords} from '../durable.js';
import {digest,sourceIdentity} from '../source-identity.js';

export const EXPORT_VERSION='sealed-matched-padded-v2-public-v2';
export const REPO_ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const DEFAULT_HOST_ROOT=join(REPO_ROOT,'runs','challenge-host');
const hex64=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const keys=(x,expected,where)=>{
  if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==expected.toSorted().join('|'))throw new Error(where+': unexpected or missing public fields');
};
export function validatePublicWorld(world){
  keys(world,['alphabet','rules','rulesText','trainingPairs','worldDigest','exportVersion'],'world');
  if(world.exportVersion!==EXPORT_VERSION)throw new Error('historical or unknown export version');
  const a=world.alphabet;
  if(!Array.isArray(a)||a.length<2||a.length>4||new Set(a).size!==a.length||a.some(s=>typeof s!=='string'||!/^[a-z]$/.test(s)))throw new Error('invalid public alphabet');
  const word=s=>typeof s==='string'&&[...s].every(c=>a.includes(c));
  if(!Array.isArray(world.rules)||world.rules.length<6||world.rules.length>14)throw new Error('invalid public rules');
  for(const r of world.rules){keys(r,['u','v'],'rule');if(!word(r.u)||!word(r.v)||r.u.length>3||r.v.length>3||r.u===r.v)throw new Error('invalid public rule words');}
  const text=world.rules.map((r,i)=>`${i+1}. ${r.u||'ε'} ↔ ${r.v||'ε'}`).join('\n');
  if(world.rulesText!==text)throw new Error('rulesText differs from public rules');
  if(!Array.isArray(world.trainingPairs)||world.trainingPairs.length!==200)throw new Error('public world must contain 200 training pairs');
  for(const [pairs,labeled]of [[world.trainingPairs,true]])for(const p of pairs){
    keys(p,labeled?['a','b','label']:['a','b'],labeled?'training pair':'sealed pair');
    if(!word(p.a)||!word(p.b)||labeled&&typeof p.label!=='boolean')throw new Error('invalid public pair');
  }
  if(!hex64(world.worldDigest))throw new Error('invalid world digest');
  return world;
}
export function publicWorld(inst){
  // No sealed rows are exported. Fit sees publicEvidence only, without this envelope.
  const world={...publicEvidence(inst),worldDigest:inst.worldDigest,exportVersion:EXPORT_VERSION};
  return validatePublicWorld(world);
}
export const publicBytes=world=>JSON.stringify(validatePublicWorld(world),null,2)+'\n';

// Resolve existing ancestors too, so a symlink cannot place a private index in the export.
export function canonicalPath(path){
  const full=resolve(path);let result;
  if(existsSync(full))result=realpathSync(full);
  else{const parent=dirname(full);result=parent===full?full:join(canonicalPath(parent),relative(parent,full));}
  return process.platform==='win32'?result.toLowerCase():result;
}
export function assertOutsidePublic(publicDir,path){
  const rel=relative(canonicalPath(publicDir),canonicalPath(path));
  if(rel===''||!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep))throw new Error('host evidence and results must stay outside the public directory');
}
export function hostIndexPath(publicDir,hostRoot=DEFAULT_HOST_ROOT){
  assertOutsidePublic(publicDir,hostRoot);
  return join(resolve(hostRoot),digest(canonicalPath(publicDir))+'.jsonl');
}
export function loadLedger(path,expectedHash){
  const absolute=resolve(path),bytes=readFileSync(absolute),hash=digest(bytes);
  if(expectedHash!==undefined&&expectedHash!==hash)throw new Error('host construction ledger changed since export');
  const records=readRecords(absolute),summary=constructionSummary(records);
  return {path:absolute,hash,header:records[0],entries:summary.entries};
}
export function regenerateWorld(ledger,entry){
  if(ledger.header.samplerVersion!=='sealed-matched-padded-v2')throw new Error('historical leaking sampler ledger refused');
  if(!entry.constructionValid||entry.disposition!=='accepted')throw new Error('world is not accepted in the host construction ledger');
  let world;
  try{const p=ledger.header.proposals[entry.index],inst=make(p.seed,p.opts);world=sealWorld(inst,constructSealed(inst));}
  catch{throw new Error('host could not regenerate accepted world '+entry.worldDigest);}
  if(world.worldDigest!==entry.worldDigest||world.family!==entry.effectiveClassification||world.requestedFamily!==entry.requestedFamily)throw new Error('regenerated world differs from host construction evidence');
  checkWorld({world,construction:entry});
  return world;
}
export function loadPublicDirectory(publicDir,{hostRoot=DEFAULT_HOST_ROOT}={}){
  const path=hostIndexPath(publicDir,hostRoot),records=readRecords(path),index=records[0];
  if(records.length!==1||index?.type!=='challenge-host-index'||index.version!==2||index.exportVersion!==EXPORT_VERSION||index.publicDirectory!==canonicalPath(publicDir)||index.sourceHash!==sourceIdentity()||!Array.isArray(index.ledgers)||!Array.isArray(index.worlds)||!index.worlds.length)throw new Error('invalid, moved or source-mismatched challenge host index');
  const ledgers=index.ledgers.map(l=>loadLedger(l.path,l.hash));
  const expected=ledgers.flatMap((l,ledger)=>l.entries.filter(e=>e.constructionValid).map(e=>({ledger,proposalIndex:e.index,worldDigest:e.worldDigest})));
  if(expected.length!==index.worlds.length)throw new Error('host index omits accepted worlds');
  const names=readdirSync(publicDir).sort(),wanted=index.worlds.map(w=>w.file).sort();
  if(JSON.stringify(names)!==JSON.stringify(wanted)||new Set(wanted).size!==wanted.length)throw new Error('public directory has missing, duplicate or unregistered files');
  const worlds=index.worlds.map((entry,i)=>{
    if(!/^world-[0-9]{6}-[0-9a-f]{64}\.json$/.test(entry.file)||!hex64(entry.publicHash)||entry.ledger!==expected[i].ledger||entry.proposalIndex!==expected[i].proposalIndex||entry.worldDigest!==expected[i].worldDigest)throw new Error('host index world assignment mismatch');
    const file=join(publicDir,entry.file),stat=lstatSync(file);
    if(!stat.isFile()||stat.isSymbolicLink())throw new Error('public world must be a regular file');
    const bytes=readFileSync(file),world=validatePublicWorld(JSON.parse(bytes));
    if(digest(bytes)!==entry.publicHash||world.worldDigest!==entry.worldDigest)throw new Error('public world changed since export');
    return {entry,public:world,ledger:ledgers[entry.ledger],construction:ledgers[entry.ledger].entries[entry.proposalIndex]};
  });
  return {index,indexHash:digest(readFileSync(path)),worlds};
}
