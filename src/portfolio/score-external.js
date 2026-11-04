// Outside code runs only through the existing fresh-QuickJS reachability contract.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {runProgram} from '../sandbox.js';
import {validateResult} from '../result-contract.js';
import {durableAppend} from '../durable.js';
import {digest,sourceIdentity} from '../source-identity.js';
import {REPO_ROOT,DEFAULT_HOST_ROOT,assertOutsidePublic,loadPublicDirectory,regenerateWorld,publicWorld,publicBytes} from './challenge-public.js';

export const EXTERNAL_BUDGET=Object.freeze({timeoutMs:20000,maxSandboxCalls:201});
const budgetCheck=({timeoutMs,maxSandboxCalls})=>{
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)throw new Error('timeout-ms must be an integer in [1,120000]');
  if(!Number.isSafeInteger(maxSandboxCalls)||maxSandboxCalls<1||maxSandboxCalls>100000)throw new Error('max-calls must be an integer in [1,100000]');
};
function summarize(rows,familyField){
  const groups={};
  for(const row of rows){
    const g=groups[row[familyField]]??={worlds:0,scoredWorlds:0,failedWorlds:0,successes:0,accuracySum:0,sandboxCalls:0,sandboxMs:0,hostPreparationMs:0,chargedProgramBytes:0};
    g.worlds++;g.successes+=Number(row.success);g.sandboxCalls+=row.work.sandboxCalls;g.sandboxMs+=row.work.sandboxMs;g.hostPreparationMs+=row.work.hostPreparationMs;g.chargedProgramBytes+=row.work.chargedProgramBytes;
    if(row.accuracy===null)g.failedWorlds++;else{g.scoredWorlds++;g.accuracySum+=row.accuracy;}
  }
  for(const g of Object.values(groups)){
    g.meanAccuracyScoredWorlds=g.scoredWorlds?g.accuracySum/g.scoredWorlds:null;
    g.accuracyBoundsAcrossAllWorlds=[g.accuracySum/g.worlds,(g.accuracySum+g.failedWorlds)/g.worlds];delete g.accuracySum;
  }
  return groups;
}
export async function scoreExternal(solverFile,publicDir,{hostRoot=DEFAULT_HOST_ROOT,outputDir=join(REPO_ROOT,'challenge','results'),timeoutMs=EXTERNAL_BUDGET.timeoutMs,maxSandboxCalls=EXTERNAL_BUDGET.maxSandboxCalls,onProgress=null}={}){
  budgetCheck({timeoutMs,maxSandboxCalls});assertOutsidePublic(publicDir,outputDir);
  const source=readFileSync(solverFile,'utf8');if(!source.length||source.length>2_000_000)throw new Error('solver source must contain 1..2000000 characters');
  const corpus=loadPublicDirectory(publicDir,{hostRoot}),runId=randomBytes(16).toString('hex'),sourceHash=sourceIdentity();
  const directory=resolve(outputDir);mkdirSync(directory,{recursive:true});
  const archive=join(directory,runId+'.solver.js'),log=join(directory,runId+'.jsonl'),report=join(directory,runId+'.json');
  writeFileSync(archive,source,{flag:'wx'});
  const meta={type:'external-score-meta',version:1,runId,solverName:basename(solverFile),solverHash:digest(source),sourceHash,publicIndexHash:corpus.indexHash,worlds:corpus.worlds.length,budget:{timeoutMs,maxSandboxCalls},outputCondition:'unrestricted',contract:'reachability',scope:'development challenge; descriptive scores only',workPolicy:'one charge per fresh sandbox invocation, including inspect; solver top-level preparation repeats and is timed each call; report elapsed sandbox time and program/input bytes, not unmeasured primitive instructions',startedAt:new Date().toISOString()};
  durableAppend(log,meta,{exclusive:true});const rows=[];
  try{
    for(const item of corpus.worlds){
      const preparedAt=performance.now(),world=regenerateWorld(item.ledger,item.construction),publicInput=publicWorld(world);
      if(publicBytes(publicInput)!==publicBytes(item.public))throw new Error('public evidence does not match regenerated host world');
      // Only the validated public projection is embedded. The host instance is never serialized.
      const code='const publicWorld=JSON.parse('+JSON.stringify(JSON.stringify(publicInput))+');\n'+source;
      const work={sandboxCalls:0,completedSandboxCalls:0,inspectCalls:0,reachableCalls:0,sandboxMs:0,elapsedMs:0,hostPreparationMs:performance.now()-preparedAt,chargedProgramBytes:0,chargedInputBytes:0,primitiveOperations:null,primitiveOperationsReason:'the existing sandbox contract does not expose an instruction counter; no solver-reported work is trusted'};
      const started=performance.now(),deadline=started+timeoutMs;
      const meteredRun=async(program,input,remaining)=>{
        // Keep the contract boundary narrow even if the host verifier later gains new fields.
        const expected=input.op==='inspect'?['op']:input.op==='reachable'?['a','b','op']:null;
        if(!expected||Object.keys(input).sort().join('|')!==expected.join('|'))throw new Error('nonpublic contract input refused');
        if(work.sandboxCalls>=maxSandboxCalls)throw new Error('sandbox call budget exhausted');
        const allowed=Math.min(remaining,deadline-performance.now());if(allowed<=0)throw new Error('total sandbox evaluation budget exhausted');
        work.sandboxCalls++;work[input.op==='inspect'?'inspectCalls':'reachableCalls']++;
        work.chargedProgramBytes+=Buffer.byteLength(program);work.chargedInputBytes+=Buffer.byteLength(JSON.stringify(input));
        const began=performance.now();
        try{const result=await runProgram(program,input,allowed);if(result.ok)work.completedSandboxCalls++;return result;}
        finally{work.sandboxMs+=performance.now()-began;}
      };
      let result=code.length>2_000_000?{ok:false,stage:'load',error:'solver plus public evidence exceeds the existing source-size limit'}
        :await world.contract.score(code,world,{runProgram:meteredRun,timeoutMs,outputCondition:'unrestricted'});
      work.elapsedMs=performance.now()-started;
      if(result.ok&&work.elapsedMs>timeoutMs)result={ok:false,stage:'verify',error:'total sandbox evaluation budget exhausted'};
      validateResult(result,'external result',world);
      const row={type:'external-world-score',worldDigest:world.worldDigest,publicFile:item.entry.file,family:world.family,requestedFamily:world.requestedFamily,status:result.ok?'scored':'failed',accuracy:result.ok?result.accuracy:null,correct:result.ok?result.correct:null,total:world.sealedPairs.length,success:result.ok&&result.accuracy>=.95,failure:result.ok?null:{stage:result.stage,reason:result.error},work};
      durableAppend(log,row);rows.push(row);onProgress?.({completed:rows.length,total:corpus.worlds.length,worldDigest:world.worldDigest});
    }
    // Detect evidence/source changes without silently keeping a mixed run.
    if(sourceIdentity()!==sourceHash||loadPublicDirectory(publicDir,{hostRoot}).indexHash!==corpus.indexHash)throw new Error('challenge evidence changed during scoring');
    const summary={...meta,status:'completed',completedAt:new Date().toISOString(),byFamily:summarize(rows,'family'),byRequestedFamily:summarize(rows,'requestedFamily'),worldResults:rows,liveModelCalls:0};
    durableAppend(log,{type:'external-score-end',status:'completed',worlds:rows.length});
    writeFileSync(report,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
    return {runId,log,report,solverArchive:archive,summary};
  }catch(error){durableAppend(log,{type:'external-score-end',status:'aborted',completedWorlds:rows.length,reason:error.message});throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [solver,publicDir,...args]=process.argv.slice(2),options={};
    if(!solver||!publicDir)throw new Error('usage: node src/portfolio/score-external.js <solver.js> <public-directory> [--timeout-ms N] [--max-calls N] [--out results-directory]');
    for(let i=0;i<args.length;i++){
      const key={'--timeout-ms':'timeoutMs','--max-calls':'maxSandboxCalls','--out':'outputDir','--host-root':'hostRoot'}[args[i]],value=args[++i];
      if(!key||!value||value.startsWith('--'))throw new Error('unknown option or missing value');
      options[key]=['timeoutMs','maxSandboxCalls'].includes(key)?(/^[1-9][0-9]*$/.test(value)?Number(value):NaN):value;
    }
    scoreExternal(solver,publicDir,options).then(r=>console.log(JSON.stringify({runId:r.runId,report:r.report,log:r.log,worlds:r.summary.worlds,byFamily:r.summary.byFamily}))).catch(e=>{console.error(e.message);process.exitCode=1;});
  }catch(error){console.error(error.message);process.exitCode=1;}
}
