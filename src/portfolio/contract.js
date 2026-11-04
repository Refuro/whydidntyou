import {initializePairSandbox,runPairStage} from '../sandbox.js';
import {REGISTRATION} from './registration.js';
export const BUDGET=Object.freeze({fitMs:REGISTRATION.fitMs,inferenceMs:REGISTRATION.inferenceMs,pairMs:REGISTRATION.pairMs,maxInferenceCalls:REGISTRATION.maxInferenceCalls});
export function validateBudget(budget){for(const k of Object.keys(BUDGET))if(!Number.isSafeInteger(budget[k])||budget[k]<1||budget[k]>120000)throw new Error('invalid '+k+' budget');}
export function validateProgram(program){
  if(typeof program==='string')return {format:'fit-predict-source-v2',fitSource:program,inferenceSource:program};
  if(program?.format!=='fit-predict-source-v2'||Object.keys(program).sort().join('|')!=='fitSource|format|inferenceSource'||[program.fitSource,program.inferenceSource].some(s=>typeof s!=='string'||!s.length||s.length>2_000_000))throw new Error('invalid fit/predict source package');
  return program;
}
export async function fitOnce(code,view,{budget=BUDGET,reference=false}={}){
  validateBudget(budget);code=validateProgram(code);
  // This projection is the entire fit input, even when called with an export envelope.
  const publicEvidence={alphabet:view.alphabet,rules:view.rules.map(({u,v})=>({u,v})),rulesText:view.rulesText,trainingPairs:view.trainingPairs.map(({a,b,label})=>({a,b,label}))};
  const initialization=await initializePairSandbox(),moduleInitializationMs=initialization.actualMs,started=performance.now();
  const result=await runPairStage(code.fitSource,{op:'fit',publicEvidence},budget.fitMs),ms=performance.now()-started;
  if(result.ok&&(typeof result.value!=='string'||Buffer.byteLength(result.value)>REGISTRATION.maxStateBytes))Object.assign(result,{ok:false,error:'invalid serialized state size'});
  let metadata={};if(reference&&result.ok)metadata=JSON.parse(result.value).fit;
  return {code,state:result.ok?result.value:null,reference,budget,fit:{...metadata,status:result.ok?(metadata.status??'fitted'):'failed',reason:result.ok?(metadata.reason??null):result.error,ms,moduleInitializationMs,standalonePreparationMs:ms+initialization.coldStartEstimateMs,standaloneIsColdStartEstimate:true,coldModuleInitializationEstimateMs:initialization.coldStartEstimateMs,amortizedPreparationMs:ms,stateBytes:result.ok?Buffer.byteLength(result.value):0,calls:1,memberSpecificSearchCounters:reference?metadata.memberSpecificSearchCounters??{}:null}};
}
export async function scorePairs(prepared,pairs){
  const {budget}=prepared,started=performance.now(),resources={ms:0,calls:0,completedCalls:0,cacheHits:0,memberSpecificSearchCounters:prepared.reference?{}:null};
  let failure=prepared.state===null?{stage:'fit',reason:prepared.fit.reason}:null,correct=0;
  const scales={small:{n:0,correct:0},large:{n:0,correct:0}};
  if(!failure)for(const p of pairs){
    const remaining=budget.inferenceMs-(performance.now()-started);
    if(remaining<=0||resources.calls>=budget.maxInferenceCalls){failure={stage:'inference',reason:'inference time or call budget exhausted'};break;}
    resources.calls++;
    const r=await runPairStage(prepared.code.inferenceSource,{op:'predict',state:prepared.state,a:p.a,b:p.b},Math.min(remaining,budget.pairMs));
    if(!r.ok||typeof r.value!=='boolean'){failure={stage:'inference',reason:r.error??'nonboolean prediction'};break;}
    resources.completedCalls++;const hit=r.value===p.label;correct+=Number(hit);
    const s=scales[p.scale??'small'];s.n++;s.correct+=Number(hit);
    if(prepared.reference)for(const [k,v]of Object.entries(r.counters??{})){
      const n=typeof v==='boolean'?Number(v):v;if(!Number.isFinite(n)||n<0)throw new Error('invalid reference counter');
      resources.memberSpecificSearchCounters[k]=k==='maxDepth'?Math.max(resources.memberSpecificSearchCounters[k]??0,n):(resources.memberSpecificSearchCounters[k]??0)+n;
    }
  }
  resources.ms=performance.now()-started;
  if(!failure&&resources.ms>budget.inferenceMs)failure={stage:'inference',reason:'inference wall-clock budget exhausted'};
  const accuracy=failure?null:correct/pairs.length,smallAccuracy=failure||!scales.small.n?null:scales.small.correct/scales.small.n,largeAccuracy=failure||!scales.large.n?null:scales.large.correct/scales.large.n;
  return {status:failure?'failed':'scored',accuracy,correct:failure?null:correct,total:pairs.length,success:accuracy!==null&&accuracy>=.95,failure,smallAccuracy,largeAccuracy,paddingRobustnessGap:smallAccuracy===null||largeAccuracy===null?null:smallAccuracy-largeAccuracy,resources};
}
