import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {publicEvidence} from '../domains/invariantGame.js';
import {fold} from '../algebra.js';
import {counter,BudgetExceeded,templates,imageSearch,positionalSearch,foldModel} from './search.js';
import {countModel,featureDictionary,nuisanceModel} from './features.js';
import {finiteStateModel} from './finite-state.js';
import {rewriteSearch,canonicalModel,SEARCH_CURVES} from './bfs.js';
export const REGISTRATION=Object.freeze({version:'portfolio-b4-v1',fitOperations:2_000_000,totalOperations:60_000_000,totalMs:20000,workAccounting:'fit: counted assignments, rule/example checks, symbol transitions and law triples; linear algebra precharged a dimension bound; score: actual BFS candidate positions, one unit per cache hit, otherwise declared conservative kernel-work bounds; wall ceiling checked between pair calls',finiteStateChoicesPerQ:4096,grammarRounds:16,selector:'highest public training accuracy; ties by registration order; chosen before any sealed scoring',grammar:'Eq(Fold(T,images,a),Fold(T,images,b)); T ranges over registered cyclic/abelian/group/transformation templates; relations constrain images; first counterexample is added to the active constraints each round',memoization:'unlabelled (a,b) predictions cached per member across public and sealed sets; cache hits charged one operation',searchCurves:SEARCH_CURVES});
export const MEMBERS=Object.freeze([
  {id:'count-linear',language:'Gaussian elimination on rule count differences modulo 2 and 3'},
  {id:'group-full',language:'enumerate symbol homomorphisms into C2..C6, C2xC2, C3xC3, S3, Q8, D4, A4'},
  {id:'group-quotients',language:'same search into all proper quotients of the registered groups'},
  {id:'monoid-csp',language:'backtracking symbol-image CSP over registered finite tables; exhaustive laws, partial rules and examples'},
  {id:'joint-coarse',language:'fit a public finite-table CSP then majority-classify the joint proper-quotient and count tuple'},
  {id:'finite-state',language:'infer complete letter transformations on q=2,3,4 points; retain full product with <=q^q states'},
  {id:'rewrite-normal-form',language:'bounded shortlex-decreasing rewrite normalization'},
  {id:'grammar-cegis',language:'relation-constrained finite fold grammar with public counterexample refinement'},
  {id:'nuisance-stumps',language:'fitted threshold stumps on lengths, histogram L1, edit, LCS, positional agreement and bigram differences'},
  {id:'positional-template',language:'registered ambient templates with their historical generator images at public alphabet positions; free remaining images'},
  ...SEARCH_CURVES.map(b=>({id:'bfs-'+b.name,language:'bounded single-rule FIFO string search',search:b})),
  {id:'bidirectional',language:'bounded two-frontier reversible rewrite search',search:SEARCH_CURVES[0]}
]);
function cegis(view,meter){
  const active=view.trainingPairs.slice(0,2),catalog=templates({monoids:true});
  for(let round=0;round<REGISTRATION.grammarRounds;round++){
    const spec=imageSearch(view,{catalog,csp:true,examples:active,meter});if(!spec)return null;
    let counterexample=null;
    for(const p of view.trainingPairs){meter.tick('exampleChecks');meter.tick('transitions',p.a.length+p.b.length);if((fold(p.a,spec)===fold(p.b,spec))!==p.label){counterexample=p;break;}}
    if(!counterexample)return foldModel(spec);meter.tick('counterexamples');active.push(counterexample);
  }
  return null;
}
export function fitPublic(member,view,{fitOperations=REGISTRATION.fitOperations}={}){
  const meter=counter(fitOperations),started=performance.now();let model=null,reason=null;
  try{
    if(member.id==='count-linear'){meter.tick('linearAlgebraBound',2*view.rules.length*view.alphabet.length**3);model=countModel(view);}
    else if(member.id==='group-full'||member.id==='group-quotients'){
      const spec=imageSearch(view,{catalog:templates({quotients:member.id==='group-quotients'}),meter});if(spec)model=foldModel(spec);
    }else if(member.id==='monoid-csp'||member.id==='joint-coarse'){
      const spec=imageSearch(view,{catalog:templates({monoids:true}),csp:true,meter});
      if(spec){model=member.id==='monoid-csp'?foldModel(spec):featureDictionary(view,spec);if(member.id==='joint-coarse')meter.tick('featurePreparation',view.trainingPairs.reduce((n,p)=>n+p.a.length+p.b.length,0));}
    }else if(member.id==='finite-state')model=finiteStateModel(view,meter,{choicesPerQ:REGISTRATION.finiteStateChoicesPerQ});
    else if(member.id==='rewrite-normal-form'){meter.tick('rulePreparation',view.rules.length);model=canonicalModel(view);}
    else if(member.id==='grammar-cegis')model=cegis(view,meter);
    else if(member.id==='nuisance-stumps')model=nuisanceModel(view,meter);
    else if(member.id==='positional-template'){const spec=positionalSearch(view,meter);if(spec)model=foldModel(spec);}
    else if(member.search){meter.tick('rulePreparation',view.rules.length);model={predict:(a,b)=>rewriteSearch(a,b,view.rules,member.search,{bidirectional:member.id==='bidirectional'})};}
    else throw new Error('unknown portfolio member '+member.id);
  }catch(e){if(!(e instanceof BudgetExceeded))throw e;reason=e.message;}
  if(!model)reason??='no consistent program within registered search';
  return {model:model??{predict:()=>false},fit:{status:reason?'unavailable':'fitted',reason,primitiveCounts:meter.counts,ms:performance.now()-started,statesBound:model?.statesBound??null,points:model?.points??null},cache:new Map(),usedOperations:meter.counts.operations,usedMs:performance.now()-started};
}
export function scorePrepared(prepared,pairs,member){
  const started=performance.now(),stats={visitedNodes:0,testedPositions:0,maxDepth:0,budgetExhaustions:0,uniquePredictions:0,cacheHits:0,operations:0,totalBudgetExhaustions:0};let correct=0;
  const scales={small:{n:0,correct:0},large:{n:0,correct:0}};
  for(const p of pairs){
    const key=JSON.stringify([p.a,p.b]);let r,computed=false;
    const ceiling=member.search?member.search.maxPositions:member.id==='rewrite-normal-form'?32768:member.id==='nuisance-stumps'?p.a.length*p.b.length*4+(p.a.length+p.b.length)*64:(p.a.length+p.b.length)*(prepared.fit.points??1);
    const required=prepared.cache.has(key)?1:ceiling;
    if(prepared.usedOperations+required>REGISTRATION.totalOperations||prepared.usedMs+performance.now()-started>=REGISTRATION.totalMs){r={prediction:false};stats.totalBudgetExhaustions++;}
    else if(prepared.cache.has(key)){r=prepared.cache.get(key);stats.cacheHits++;stats.operations++;prepared.usedOperations++;}
    else{
      const value=prepared.model.predict(p.a,p.b);r=typeof value==='boolean'?{prediction:value}:value;
      if(typeof r.prediction!=='boolean')throw new Error('portfolio returned nonboolean prediction');
      prepared.cache.set(key,r);stats.uniquePredictions++;computed=true;
      const cost=member.search?r.testedPositions:member.id==='rewrite-normal-form'?32768:member.id==='nuisance-stumps'?p.a.length*p.b.length*4+(p.a.length+p.b.length)*64:(p.a.length+p.b.length)*(prepared.fit.points??1);
      stats.operations+=cost;prepared.usedOperations+=cost;
    }
    if(computed){stats.visitedNodes+=r.visitedNodes??0;stats.testedPositions+=r.testedPositions??0;}stats.maxDepth=Math.max(stats.maxDepth,r.maxDepth??0);stats.budgetExhaustions+=Number(r.budgetExhausted??false);
    const hit=r.prediction===p.label;correct+=Number(hit);const scale=scales[p.scale??'small'];scale.n++;scale.correct+=Number(hit);
  }
  const ms=performance.now()-started;prepared.usedMs+=ms;
  return {accuracy:correct/pairs.length,success:correct/pairs.length>=.95,correct,total:pairs.length,smallAccuracy:scales.small.n?scales.small.correct/scales.small.n:null,largeAccuracy:scales.large.n?scales.large.correct/scales.large.n:null,resources:{...stats,ms,budgetExhaustionFrequency:stats.budgetExhaustions/pairs.length,totalOperations:prepared.usedOperations}};
}
export function runPortfolio(world,{members=MEMBERS}={}){
  const view=publicEvidence(world),prepared=members.map(member=>({member,prepared:fitPublic(member,view)}));
  const rows=prepared.map(({member,prepared:p})=>({id:member.id,language:member.language,fit:p.fit,public:scorePrepared(p,view.trainingPairs,member)}));
  const selectorIndex=rows.reduce((best,r,i)=>r.public.accuracy>rows[best].public.accuracy?i:best,0);
  // Selection is finished before sealed labels are touched.
  for(let i=0;i<rows.length;i++){
    rows[i].sealed=scorePrepared(prepared[i].prepared,world.sealedPairs,members[i]);
    rows[i].natural=scorePrepared(prepared[i].prepared,world.naturalSealedPairs??world.sealedPairs,members[i]);
  }
  const best=field=>rows.reduce((winner,row)=>row[field].accuracy>winner[field].accuracy?row:winner,rows[0]);
  return {seed:world.seed,requestedFamily:world.requestedFamily,family:world.family,worldDigest:world.worldDigest,registration:REGISTRATION.version,rows,oraclePortfolio:{label:'ORACLE: best member selected using sealed labels',sealed:{member:best('sealed').id,accuracy:best('sealed').sealed.accuracy},natural:{member:best('natural').id,accuracy:best('natural').natural.accuracy}},implementableSelector:{rule:REGISTRATION.selector,member:rows[selectorIndex].id,publicAccuracy:rows[selectorIndex].public.accuracy,sealedAccuracy:rows[selectorIndex].sealed.accuracy,naturalAccuracy:rows[selectorIndex].natural.accuracy}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const bundle=JSON.parse(readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(runPortfolio(bundle.world??bundle),null,2));}
