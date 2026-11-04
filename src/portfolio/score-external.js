// Both external and builder members use exactly the same fit/predict stage runner.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {constructionSummary} from '../construction-ledger.js';
import {readRecords} from '../durable.js';
import {durableAppend} from '../durable.js';
import {digest,sourceIdentity} from '../source-identity.js';
import {BUDGET,validateBudget,validateProgram,fitOnce,scorePairs} from './contract.js';
import {REPO_ROOT,EXPORT_VERSION,DEFAULT_HOST_ROOT,assertOutsidePublic,loadPublicDirectory,regenerateWorld,publicWorld,publicBytes} from './challenge-public.js';
export const EXTERNAL_BUDGET=BUDGET;
function summarize(rows,familyField){
  const groups={};
  for(const row of rows){
    const g=groups[row[familyField]]??={worlds:0,scoredWorlds:0,failedWorlds:0,successes:0,accuracySum:0,sandboxCalls:0,sandboxMs:0,hostPreparationMs:0,chargedProgramBytes:0};
    g.worlds++;g.successes+=Number(row.success);g.sandboxCalls+=row.fit.calls+row.sealed.resources.calls;g.sandboxMs+=row.fit.ms+row.sealed.resources.ms;g.hostPreparationMs+=row.hostPreparationMs;g.chargedProgramBytes+=row.programBytes;
    if(row.accuracy===null)g.failedWorlds++;else{g.scoredWorlds++;g.accuracySum+=row.accuracy;}
  }
  for(const g of Object.values(groups)){
    g.meanAccuracyScoredWorlds=g.scoredWorlds?g.accuracySum/g.scoredWorlds:null;
    g.accuracyBoundsAcrossAllWorlds=[g.accuracySum/g.worlds,(g.accuracySum+g.failedWorlds)/g.worlds];delete g.accuracySum;
  }
  return groups;
}

export async function scoreExternal(solverFile,publicDir,{hostRoot=DEFAULT_HOST_ROOT,outputDir=join(REPO_ROOT,'challenge','results'),budget=BUDGET,onProgress=null}={}){
  validateBudget(budget);assertOutsidePublic(publicDir,outputDir);
  const source=readFileSync(solverFile,'utf8');if(!source.length||source.length>4_100_000)throw new Error('invalid solver source size');
  const program=validateProgram(source.trimStart().startsWith('{')?JSON.parse(source):source);
  const corpus=loadPublicDirectory(publicDir,{hostRoot}),runId=randomBytes(16).toString('hex'),sourceHash=sourceIdentity();
  const directory=resolve(outputDir);mkdirSync(directory,{recursive:true});
  const archive=join(directory,runId+'.solver.txt'),log=join(directory,runId+'.jsonl'),report=join(directory,runId+'.json');
  writeFileSync(archive,source,{flag:'wx'});
  const meta={type:'external-score-meta',version:2,exportVersion:EXPORT_VERSION,runId,solverName:basename(solverFile),solverHash:digest(source),sourceHash,publicIndexHash:corpus.indexHash,worlds:corpus.worlds.length,budget,contract:'fit-once-private-pair-v2',scope:'development challenge; descriptive scores only',workPolicy:'fit once; fresh runtime/context per row; no cross-set cache; equal independent public/challenge/natural inference budgets; wall-clock includes context, load, parse, execute and cleanup; module initialization reported separately; no external self-reported counters trusted',startedAt:new Date().toISOString()};
  durableAppend(log,meta,{exclusive:true});const rows=[];
  try{
    for(const item of corpus.worlds){
      const preparedAt=performance.now(),world=regenerateWorld(item.ledger,item.construction),publicInput=publicWorld(world);
      if(publicBytes(publicInput)!==publicBytes(item.public))throw new Error('public evidence does not match regenerated host world');
      const hostPreparationMs=performance.now()-preparedAt,p=await fitOnce(program,publicInput,{budget});
      const publicScore=await scorePairs(p,publicInput.trainingPairs),sealed=await scorePairs(p,world.sealedPairs),natural=await scorePairs(p,world.naturalSealedPairs);
      const row={type:'external-world-score',exportVersion:EXPORT_VERSION,worldDigest:world.worldDigest,publicFile:item.entry.file,family:world.family,requestedFamily:world.requestedFamily,status:sealed.status,accuracy:sealed.accuracy,correct:sealed.correct,total:sealed.total,success:sealed.success,failure:sealed.failure,fit:p.fit,public:publicScore,sealed,natural,hostPreparationMs,programBytes:Buffer.byteLength(source),support:world.sealedConstruction.supportSummary};
      durableAppend(log,row);rows.push(row);onProgress?.({completed:rows.length,total:corpus.worlds.length,worldDigest:world.worldDigest});
    }
    if(sourceIdentity()!==sourceHash||loadPublicDirectory(publicDir,{hostRoot}).indexHash!==corpus.indexHash)throw new Error('challenge evidence changed during scoring');
    const summary={...meta,status:'completed',completedAt:new Date().toISOString(),byFamily:summarize(rows,'family'),byRequestedFamily:summarize(rows,'requestedFamily'),construction:corpus.index.ledgers.map(l=>({ledger:l.path,counts:constructionSummary(readRecords(l.path)).counts})),dependence:'rows within worlds are dependent; family audits reuse seeds; no pooled interval',worldResults:rows,liveModelCalls:0};
    durableAppend(log,{type:'external-score-end',status:'completed',worlds:rows.length});writeFileSync(report,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
    return {runId,log,report,solverArchive:archive,summary};
  }catch(error){durableAppend(log,{type:'external-score-end',status:'aborted',completedWorlds:rows.length,reason:error.message});throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [solver,publicDir,...args]=process.argv.slice(2),options={},budget={...BUDGET};
    if(!solver||!publicDir)throw new Error('usage: node src/portfolio/score-external.js <solver.js|solver.json> <public-directory> [--fit-ms N] [--inference-ms N] [--pair-ms N] [--max-calls N] [--out directory]');
    for(let i=0;i<args.length;i++){
      const key={'--fit-ms':'fitMs','--inference-ms':'inferenceMs','--pair-ms':'pairMs','--max-calls':'maxInferenceCalls','--out':'outputDir','--host-root':'hostRoot'}[args[i]],value=args[++i];
      if(!key||!value||value.startsWith('--'))throw new Error('unknown option or missing value');
      if(Object.hasOwn(budget,key))budget[key]=/^[1-9][0-9]*$/.test(value)?Number(value):NaN;else options[key]=value;
    }
    scoreExternal(solver,publicDir,{...options,budget}).then(r=>console.log(JSON.stringify({runId:r.runId,report:r.report,log:r.log,worlds:r.summary.worlds,byFamily:r.summary.byFamily}))).catch(e=>{console.error(e.message);process.exitCode=1;});
  }catch(error){console.error(error.message);process.exitCode=1;}
}
