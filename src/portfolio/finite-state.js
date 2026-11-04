// Infer letter actions on q points; compare the entire resulting transformation.
// The full product automaton has at most q^q states, not merely q point states.
export function finiteStateModel(view,meter,{choicesPerQ=4096}={}){
  const alphabet=view.alphabet.toSorted();
  for(const q of [2,3,4]){
    const size=q**q,actions=Array.from({length:size},(_,v)=>Array.from({length:q},(_,i)=>Math.floor(v/q**i)%q)),identity=Array.from({length:q},(_,i)=>i),images={};let choices=0;
    const product=word=>{let state=identity;for(const a of word){meter.tick('transitions',q);const action=actions[images[a]];state=state.map(x=>action[x]);}return state.join(',');};
    const known=word=>[...word].every(a=>Object.hasOwn(images,a));
    const consistent=()=>{for(const r of view.rules)if(known(r.u)&&known(r.v)){meter.tick('ruleChecks');if(product(r.u)!==product(r.v))return false;}for(const p of view.trainingPairs)if(known(p.a)&&known(p.b)){meter.tick('exampleChecks');if((product(p.a)===product(p.b))!==p.label)return false;}return true;};
    const visit=depth=>{
      if(depth===alphabet.length){meter.tick('assignments');return {...images};}
      for(let value=0;value<size;value++){
        if(++choices>choicesPerQ)return null;meter.tick('imageChoices');images[alphabet[depth]]=value;
        if(consistent()){const found=visit(depth+1);if(found)return found;}
      }
      delete images[alphabet[depth]];return null;
    };
    const found=visit(0);if(found){const frozen={...found};return {state:{kind:'finite-state',points:q,images:frozen},statesBound:size,points:q,images:frozen,predict:(a,b)=>{
      const run=s=>{let state=identity;for(const c of s)state=state.map(x=>actions[frozen[c]][x]);return state.join(',');};return run(a)===run(b);
    }};}
  }
  return null;
}
