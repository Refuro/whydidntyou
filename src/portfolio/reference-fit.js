import {REGISTRATION} from './registration.js';
import {fold} from '../algebra.js';
import {counter,BudgetExceeded,templates,imageSearch,positionalSearch,foldModel} from './search.js';
import {countModel,featureDictionary,nuisanceModel} from './features.js';
import {finiteStateModel} from './finite-state.js';
import {rewriteSearch,canonicalModel} from './bfs.js';
function cegis(view,meter){
  const active=view.trainingPairs.slice(0,2),catalog=templates({monoids:true,meter});
  for(let round=0;round<REGISTRATION.grammarRounds;round++){
    const spec=imageSearch(view,{catalog,csp:true,examples:active,meter});if(!spec)return null;
    let counterexample=null;
    for(const p of view.trainingPairs){meter.tick('exampleChecks');meter.tick('transitions',p.a.length+p.b.length);if((fold(p.a,spec)===fold(p.b,spec))!==p.label){counterexample=p;break;}}
    if(!counterexample)return foldModel(spec);meter.tick('counterexamples');active.push(counterexample);
  }
  return null;
}
export function fitPublic(member,view,{fitOperations=REGISTRATION.fitOperations}={}){
  const meter=counter(fitOperations);let model=null,reason=null;
  try{
    if(member.id==='count-linear'){meter.tick('ruleCountCharacterVisits',2*view.rules.reduce((n,r)=>n+view.alphabet.length*r.u.length+view.alphabet.length**2*r.v.length,0));meter.tick('linearAlgebraBound',2*view.rules.length*view.alphabet.length**3);model=countModel(view);}
    else if(member.id==='group-full'||member.id==='group-quotients'){
      const spec=imageSearch(view,{catalog:templates({quotients:member.id==='group-quotients',meter}),meter});if(spec)model=foldModel(spec);
    }else if(member.id==='monoid-csp'||member.id==='joint-coarse'){
      const spec=imageSearch(view,{catalog:templates({monoids:true,meter}),csp:true,meter});
      if(spec){model=member.id==='monoid-csp'?foldModel(spec):featureDictionary(view,spec,meter);}
    }else if(member.id==='finite-state')model=finiteStateModel(view,meter,{choicesPerQ:REGISTRATION.finiteStateChoicesPerQ});
    else if(member.id==='rewrite-normal-form'){meter.tick('rulePreparation',view.rules.length);model=canonicalModel(view);}
    else if(member.id==='grammar-cegis')model=cegis(view,meter);
    else if(member.id==='nuisance-stumps')model=nuisanceModel(view,meter);
    else if(member.id==='positional-template'){const spec=positionalSearch(view,meter);if(spec)model=foldModel(spec);}
    else if(member.search){meter.tick('rulePreparation',view.rules.length);model={state:{kind:'bfs',rules:view.rules,budget:member.search,bidirectional:member.id==='bidirectional'},predict:(a,b)=>rewriteSearch(a,b,view.rules,member.search,{bidirectional:member.id==='bidirectional'})};}
    else throw new Error('unknown portfolio member '+member.id);
  }catch(e){if(!(e instanceof BudgetExceeded))throw e;reason=e.message;}
  if(!model)reason??='no consistent program within registered search';
  return {state:model?.state??{kind:'constant',value:false},fit:{status:reason?'unavailable':'fitted',reason,memberSpecificSearchCounters:meter.counts,statesBound:model?.statesBound??null,points:model?.points??null}};
}
