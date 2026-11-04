import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {publicEvidence} from '../domains/invariantGame.js';
import {MEMBERS} from './members.js';
import {REGISTRATION} from './registration.js';
import {referenceProgram} from './reference-program.js';
import {fitOnce,scorePairs} from './contract.js';
export {MEMBERS,REGISTRATION};
export const fitPublic=(member,view,options={})=>fitOnce(referenceProgram(member),view,{...options,reference:true});
export const scorePrepared=(prepared,pairs)=>scorePairs(prepared,pairs);
export async function runPortfolio(world,{members=MEMBERS}={}){
  const view=publicEvidence(world),prepared=[],rows=[];
  for(const member of members){const p=await fitPublic(member,view);prepared.push(p);rows.push({id:member.id,language:member.language,fit:p.fit,public:await scorePairs(p,view.trainingPairs)});}
  const selectorIndex=rows.reduce((best,r,i)=>(r.public.accuracy??-1)>(rows[best].public.accuracy??-1)?i:best,0);
  for(let i=0;i<rows.length;i++){rows[i].sealed=await scorePairs(prepared[i],world.sealedPairs);rows[i].natural=await scorePairs(prepared[i],world.naturalSealedPairs??world.sealedPairs);}
  const best=field=>rows.reduce((winner,row)=>(row[field].accuracy??-1)>(winner[field].accuracy??-1)?row:winner,rows[0]);
  const chosen=rows[selectorIndex],preparationMs=rows.reduce((n,r)=>n+r.fit.ms,0),publicSelectionMs=rows.reduce((n,r)=>n+r.public.resources.ms,0);
  return {seed:world.seed,requestedFamily:world.requestedFamily,family:world.family,worldDigest:world.worldDigest,samplerVersion:world.samplerVersion,registration:REGISTRATION.version,support:world.sealedConstruction?.supportSummary,analyticOracle:world.sealedConstruction?.analyticOracle,rows,
    oraclePortfolio:{label:'ORACLE: best member selected using sealed labels',sealed:{member:best('sealed').id,accuracy:best('sealed').sealed.accuracy},natural:{member:best('natural').id,accuracy:best('natural').natural.accuracy}},
    implementableSelector:{rule:REGISTRATION.selector,member:chosen.id,publicAccuracy:chosen.public.accuracy,sealedAccuracy:chosen.sealed.accuracy,naturalAccuracy:chosen.natural.accuracy,resources:{allMemberFitMs:preparationMs,allMemberPublicInferenceMs:publicSelectionMs,moduleInitializationMs:rows.reduce((n,r)=>n+r.fit.moduleInitializationMs,0),challengeTotalMs:preparationMs+publicSelectionMs+chosen.sealed.resources.ms,naturalTotalMs:preparationMs+publicSelectionMs+chosen.natural.resources.ms,memberSpecificSearchCounters:rows.map(r=>({member:r.id,fit:r.fit.memberSpecificSearchCounters,public:r.public.resources.memberSpecificSearchCounters})),chosenChallengeCounters:chosen.sealed.resources.memberSpecificSearchCounters,chosenNaturalCounters:chosen.natural.resources.memberSpecificSearchCounters}}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const bundle=JSON.parse(readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(await runPortfolio(bundle.world??bundle),null,2));}
