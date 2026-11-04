// The caller supplies the trusted instance. Results never choose their own contract.
export function validateResult(r, where='result', inst={contract:{name:'compression'}}) {
  const fail=message=>{throw new Error(`${where}: ${message}`);};
  if(!r||typeof r!=='object'||Array.isArray(r)||typeof r.ok!=='boolean')fail('result missing or ok not boolean');
  const contract=inst.contract?.name??'compression';
  if(!['compression','reachability'].includes(contract))fail('unknown trusted contract');
  if(r.contract!==undefined&&r.contract!==contract)fail('result contract differs from domain contract');
  const fields=!r.ok?['ok','stage','error']:contract==='compression'
    ?['ok','contract','bits','bitsPerSym','baseline','oracle','ratioToBaseline','ratioToOracle']
    :['ok','contract','outputCondition','correct','total','accuracy','smallAccuracy','largeAccuracy','generalizationGap','quantity','evaluationSet','success'];
  for(const key of Object.keys(r))if(!fields.includes(key))fail('foreign result field '+key);
  if(!r.ok){if(!['load','encode','decode','verify','parse','truncated'].includes(r.stage)||typeof r.error!=='string')fail('invalid failure stage/error');return;}
  const finite=x=>typeof x==='number'&&Number.isFinite(x);
  const close=(x,y)=>Math.abs(x-y)<=1e-9*Math.max(1,Math.abs(y));
  if(contract==='compression'){
    for(const f of ['bits','bitsPerSym','baseline','oracle','ratioToBaseline','ratioToOracle'])if(!finite(r[f])||r[f]<0)fail('invalid compression '+f);
    if(!Number.isSafeInteger(r.bits))fail('bits must be a non-negative integer');
    const baseline=inst.baselineBitsPerSym??inst.baseline,oracle=inst.oracleBitsPerSym??inst.oracle;
    if(inst.n!==undefined){
      if(r.baseline!==baseline||!close(r.oracle,oracle))fail('baseline/oracle differ from instance');
      if(!close(r.bitsPerSym,r.bits/inst.n))fail('bitsPerSym != bits/n');
    }
    if(!close(r.ratioToBaseline,r.bitsPerSym/r.baseline)||!close(r.ratioToOracle,r.bitsPerSym/r.oracle))fail('ratios do not follow from bitsPerSym');
  }else{
    if(r.contract!=='reachability')fail('reachability variant missing');
    if(!Number.isSafeInteger(r.total)||r.total<1||!Number.isSafeInteger(r.correct)||r.correct<0||r.correct>r.total)fail('invalid reachability counts');
    const probability=x=>finite(x)&&x>=0&&x<=1;
    if(!probability(r.accuracy)||!close(r.accuracy,r.correct/r.total)||r.success!==(r.accuracy>=.95))fail('reachability accuracy/success inconsistent');
    for(const k of ['smallAccuracy','largeAccuracy'])if(r[k]!==null&&!probability(r[k]))fail('invalid '+k);
    const gap=r.smallAccuracy===null||r.largeAccuracy===null?null:r.smallAccuracy-r.largeAccuracy;
    if(gap===null?r.generalizationGap!==null:!finite(r.generalizationGap)||!close(r.generalizationGap,gap))fail('inconsistent generalization gap');
    if(!['unrestricted','quantity-requested'].includes(r.outputCondition)||!['calibration-wall','sealed'].includes(r.evaluationSet))fail('invalid reachability evaluation condition');
    const q=r.quantity;
    if(!q||typeof q.available!=='boolean'||q.available!==(r.outputCondition==='quantity-requested'))fail('quantity availability inconsistent');
    if(q.available){
      if(typeof q.source!=='string'||typeof q.partitionsAgree!=='boolean'||!Number.isSafeInteger(q.partitionStates)||q.partitionStates<1||!probability(q.inducedPredictionAccuracy))fail('invalid quantity result');
      const c=q.conservation;
      if(!c||typeof c.passed!=='boolean'||typeof c.proved!=='boolean'||typeof c.method!=='string'||c.contextLengthBound!==3||!Number.isSafeInteger(c.applicationsChecked)||c.applicationsChecked<0||c.proved&&!c.passed)fail('invalid conservation result');
    }else if(typeof q.reason!=='string')fail('quantity absence needs reason');
  }
}

// The fixed compression default preserves the original compression-only API.
export function isSuccess(r, inst={contract:{name:'compression'}}) {
  if(r==null)return false;
  validateResult(r,'success',inst);
  return r.ok&&((inst.contract?.name??'compression')==='reachability'?r.accuracy>=.95:r.ratioToBaseline<=.6);
}
