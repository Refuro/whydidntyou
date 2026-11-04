// Registered finite-population upper limits. All probabilities computed in log space.
import { pathToFileURL } from 'node:url';
const integer=(x,name)=>{if(!Number.isSafeInteger(x)||x<0)throw new Error(name+' must be a nonnegative safe integer');};
const significance=alpha=>{if(typeof alpha!=='number'||!Number.isFinite(alpha)||alpha<=0||alpha>=1)throw new Error('alpha must be in (0,1)');};
const countArgs=(n,k)=>{integer(n,'n');integer(k,'count');if(k>n)throw new Error('count exceeds n');};
const logAdd=(a,b)=>{if(a===-Infinity)return b;if(b===-Infinity)return a;const m=Math.max(a,b);return m+Math.log1p(Math.exp(Math.min(a,b)-m));};
function logC(n,k){k=Math.min(k,n-k);let r=0;for(let i=1;i<=k;i++)r+=Math.log(n-k+i)-Math.log(i);return r;}
export function binomCdf(n,k,p) {
  countArgs(n,k);if(typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new Error('p must be in [0,1]');
  if(k===n||p===0)return 1;if(p===1)return 0;
  let total=-Infinity;
  for(let i=0;i<=k;i++)total=logAdd(total,logC(n,i)+i*Math.log(p)+(n-i)*Math.log1p(-p));
  return Math.min(1,Math.exp(total));
}
export function upperBound(n,count,alpha=.05) {
  countArgs(n,count);significance(alpha);if(count===n)return 1;
  let lo=0,hi=1;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(binomCdf(n,count,mid)>=alpha)lo=mid;else hi=mid;}return hi;
}
const logRatio=(a,b)=>a===0?-Infinity:(a>b/2?Math.log1p((a-b)/b):Math.log(a)-Math.log(b));
export function hypergeometricLogCdf(M,n,K,count) {
  integer(M,'M');integer(K,'K');countArgs(n,count);
  if(M<1||n>M||K>M)throw new Error('require M >= 1 and n,K <= M');
  const lower=Math.max(0,n-(M-K)),upper=Math.min(n,K);
  if(count<lower)return -Infinity;if(count>=upper)return 0;
  // Probability of one ordered arrangement, times the number of arrangements.
  let term=logC(n,lower);
  for(let i=0;i<lower;i++)term+=logRatio(K-i,M-i);
  for(let i=0;i<n-lower;i++)term+=logRatio(M-K-i,M-lower-i);
  let total=term;
  for(let k=lower;k<count;k++){
    term+=Math.log(K-k)-Math.log(k+1)+Math.log(n-k)-Math.log(M-K-n+k+1);
    total=logAdd(total,term);
  }
  return Math.min(0,total);
}
export function hypergeometricCdf(M,n,K,count){return Math.exp(hypergeometricLogCdf(M,n,K,count));}
export function hypergeometricUpperBound(M,n,count,alpha=.05) {
  integer(M,'M');countArgs(n,count);significance(alpha);
  if(M<1||n>M)throw new Error('require 0 <= n <= M, M >= 1');
  // Largest integer K for which the observed lower-tail event is not rejected.
  let lo=0,hi=M;
  const logAlpha=Math.log(alpha);
  while(lo<hi){const mid=lo+Math.ceil((hi-lo)/2);if(hypergeometricLogCdf(M,n,mid,count)>=logAlpha-1e-12)lo=mid;else hi=mid-1;}
  return lo;
}
export function nullBounds({n,successes,unresolved,alpha=.05,M=2**32}) {
  integer(n,'n');integer(successes,'successes');integer(unresolved,'unresolved');significance(alpha);
  if(successes+unresolved>n)throw new Error('successes + unresolved exceeds n');
  const resolved=n-unresolved,count=successes+unresolved,K=hypergeometricUpperBound(M,n,count,alpha);
  return {n,resolved,unresolved,successes,alpha,confidence:100*(1-alpha)+'%',gate:{passed:n>0&&unresolved===0,reason:n===0?'no assigned worlds':unresolved?'unresolved assigned outcomes':'all assigned outcomes resolved'},registered:{method:'hypergeometric inversion',M,count,K,upper:K/M},conservative:K/M,binomialApproximation:upperBound(n,count,alpha),resolvedOnly:resolved?hypergeometricUpperBound(M,resolved,successes,alpha)/M:null,resolvedOnlyBinomialApproximation:resolved?upperBound(resolved,successes,alpha):null,resolvedOnlyAssumption:'available only with resolved evidence; assumes resolution independent of potential outcome and the registered sampling design',conservativeMeaning:'one-sided '+100*(1-alpha)+'% upper bound allowing every unresolved slot-procedure outcome to be a success'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const a={};for(let i=2;i<process.argv.length;i+=2)a[process.argv[i].slice(2)]=Number(process.argv[i+1]);
 console.log(JSON.stringify(nullBounds({n:a.n??100,successes:a.successes??0,unresolved:a.unresolved??0,alpha:a.alpha??.05}),null,2));
}
