import test from 'node:test';
import assert from 'node:assert/strict';
import {binomCdf,upperBound,nullBounds,hypergeometricUpperBound,hypergeometricCdf} from '../src/bounds.js';
const choose=(n,k)=>{if(k<0||k>n)return 0n;let out=1n;for(let j=1;j<=Math.min(k,n-k);j++)out=out*BigInt(n-j+1)/BigInt(j);return out;};
const tailNumerator=(M,n,K,count)=>{let sum=0n;for(let x=0;x<=count;x++)sum+=choose(K,x)*choose(M-K,n-x);return sum;};
test('A5: invalid counts and significance refuse; endpoints and no evidence are explicit',()=>{
  for(const v of [{n:100,successes:-1,unresolved:0},{n:100,successes:0,unresolved:101},{n:100.5,successes:0,unresolved:0},{n:100,successes:0,unresolved:0,alpha:2}])assert.throws(()=>nullBounds(v));
  for(const alpha of [0,1,NaN,Infinity])assert.throws(()=>upperBound(10,1,alpha));
  assert.equal(binomCdf(10,0,0),1);assert.equal(binomCdf(10,10,1),1);assert.equal(binomCdf(10,9,1),0);
  assert.equal(nullBounds({n:0,successes:0,unresolved:0}).resolvedOnly,null);
  assert.equal(nullBounds({n:100,successes:0,unresolved:100}).resolvedOnly,null);
  assert.equal(nullBounds({n:1,successes:0,unresolved:0,alpha:.1}).confidence,'90%');
  assert.ok(Math.abs(upperBound(100,10)-.163717623275814)<1e-12);
});
test('A5: exact exhaustive >=95% coverage for all M<=40,n<=10,K (including n=0)',()=>{
  for(let M=1;M<=40;M++)for(let n=0;n<=Math.min(10,M);n++){
    const upper=Array.from({length:n+1},(_,x)=>hypergeometricUpperBound(M,n,x)),denom=choose(M,n);
    for(let K=0;K<=M;K++){
      let covered=0n;
      for(let x=0;x<=n;x++)if(K<=upper[x])covered+=choose(K,x)*choose(M-K,n-x);
      assert.ok(20n*covered>=19n*denom,JSON.stringify({M,n,K,upper}));
    }
  }
});
test('A5: reviewer M=79,K=77,n=2 and exact large-population boundary checks',()=>{
  assert.ok(upperBound(2,1)<77/79);
  assert.ok(hypergeometricUpperBound(79,2,1)>=77);
  assert.ok(Math.abs(hypergeometricCdf(79,2,77,1)-(1-77*76/(79*78)))<1e-12);
  for(const [n,count]of [[40,0],[40,1],[40,10],[40,39],[100,10]]){
    const M=2**32,K=hypergeometricUpperBound(M,n,count),denom=choose(M,n);
    assert.ok(20n*tailNumerator(M,n,K,count)>=denom);
    assert.ok(K===M||20n*tailNumerator(M,n,K+1,count)<denom);
  }
});
