import {existsSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {make,ConstructionDefect} from './domains/invariantGame.js';
import {constructSealed} from './sealed-sampler.js';
import {durableAppend,readRecords} from './durable.js';
import {digest,sourceIdentity} from './source-identity.js';
export const worldHash=value=>digest(JSON.stringify(value));
export function sealWorld(inst,sealed){
  const worldDigest=worldHash({generatorWorldDigest:inst.worldDigest,sealedPairs:sealed.pairs,naturalSealedPairs:sealed.naturalPairs});
  return {...inst,generatorWorldDigest:inst.worldDigest,worldDigest,instanceDigest:worldHash({seed:inst.seed,worldDigest}),sealedPairs:sealed.pairs,naturalSealedPairs:sealed.naturalPairs,sealedStatus:'constructed',sealedConstruction:sealed};
}
export function buildCorpus(path,proposals,{retainWorlds=true,onProgress=null}={}){
  if(existsSync(path))throw new Error('construction ledger already exists');
  if(proposals.some(p=>p.opts?.images!==undefined))throw new Error('registered corpus forbids image overrides');
  mkdirSync(dirname(path),{recursive:true});
  durableAppend(path,{type:'construction-meta',version:1,sourceHash:sourceIdentity(),proposals,policy:'every fixed proposal retained; no replacements; construction completes before solvers'},{exclusive:true});
  const accepted=[];
  for(const [index,p]of proposals.entries()){
    const requestedFamily=p.opts?.family??'F-nonabelian';
    durableAppend(path,{type:'proposal',index,seed:p.seed,opts:p.opts??{},requestedFamily});
    let inst=null,world=null,reason=null,defect=null;
    try{inst=make(p.seed,p.opts);world=sealWorld(inst,constructSealed(inst));}
    catch(e){if(!(e instanceof ConstructionDefect))throw e;reason=e.reason;defect=e;}
    const audit=inst?.identifiabilityAudit??defect?.audit??null;
    const entry={type:'construction',index,seed:p.seed,requestedFamily,effectiveClassification:inst?.family??defect?.effectiveClassification??null,assignmentSpace:audit?.assignmentsEnumerated??defect?.assignmentSpace??null,consistentAssignments:audit?.consistentAssignments??null,kernelClasses:audit?.inequivalentRepresentations??null,audit,eligible:inst!==null,constructionValid:world!==null,disposition:world?'accepted':'construction-defect',reason,worldDigest:world?.worldDigest??null};
    durableAppend(path,entry);
    if(world)accepted.push(retainWorlds?{world,entry}:{seed:p.seed,opts:p.opts??{},entry});
    onProgress?.({index:index+1,total:proposals.length,accepted:accepted.length});
  }
  const summary=constructionSummary(readRecords(path));return {accepted,summary};
}
export function constructionSummary(records){
  const header=records[0];if(header?.type!=='construction-meta'||header.version!==1)throw new Error('invalid construction ledger header');
  const counts={},entries=[],seen=new Set();
  for(let index=0;index<header.proposals.length;index++){
    const p=records[1+2*index],e=records[2+2*index],expected=header.proposals[index],family=expected.opts?.family??'F-nonabelian';
    if(p?.type!=='proposal'||p.index!==index||p.seed!==expected.seed||p.requestedFamily!==family||JSON.stringify(p.opts)!==JSON.stringify(expected.opts??{}))throw new Error('construction proposal does not match assignment');
    const key=JSON.stringify(expected);if(seen.has(key))throw new Error('duplicate proposed world');seen.add(key);
    if(e?.type!=='construction'||e.index!==index||e.seed!==p.seed||e.requestedFamily!==family||typeof e.eligible!=='boolean'||typeof e.constructionValid!=='boolean'||e.constructionValid&&!e.eligible)throw new Error('construction disposition missing or inconsistent');
    if(e.constructionValid?(e.disposition!=='accepted'||e.reason!==null||typeof e.worldDigest!=='string'):(e.disposition!=='construction-defect'||typeof e.reason!=='string'))throw new Error('invalid construction reason/acceptance');
    for(const k of ['assignmentSpace','consistentAssignments','kernelClasses'])if(e[k]!==null&&(!Number.isSafeInteger(e[k])||e[k]<0))throw new Error('invalid assignment/class count');
    if(e.audit&&(e.consistentAssignments!==e.audit.consistentAssignments||e.kernelClasses!==e.audit.inequivalentRepresentations))throw new Error('audit count mismatch');
    const c=counts[family]??={proposed:0,eligible:0,constructionValid:0,reasons:{},effectiveClassifications:{}};
    c.proposed++;c.eligible+=Number(e.eligible);c.constructionValid+=Number(e.constructionValid);if(e.reason)c.reasons[e.reason]=(c.reasons[e.reason]??0)+1;
    const classification=e.effectiveClassification??'unavailable';c.effectiveClassifications[classification]=(c.effectiveClassifications[classification]??0)+1;entries.push(e);
  }
  if(records.length!==1+2*header.proposals.length)throw new Error('extra or missing construction evidence');
  for(const c of Object.values(counts)){c.eligibilityRate=c.eligible/c.proposed;c.acceptanceRate=c.constructionValid/c.proposed;}
  return {counts,entries};
}
