import {createHash} from 'node:crypto';
// Domain-separated SHA-256 stream; rejection removes modulo bias for each choice.
export function samplingStream(seed,domain){
  let counter=0;
  return n=>{
    if(!Number.isSafeInteger(n)||n<1||n>2**32)throw new Error('invalid sampling range');
    const limit=Math.floor(2**32/n)*n;
    for(;;){const word=createHash('sha256').update(`invariant-b3|${seed}|${domain}|${counter++}`).digest().readUInt32BE(0);if(word<limit)return word%n;}
  };
}
export function permute(values,draw){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=draw(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
