import {drawSeeds} from './validate.js';

export function sourceHexToMaster(sourceHex){
  if(typeof sourceHex!=='string'||!/^(?:[0-9a-fA-F]{2}){1,32}$/.test(sourceHex))throw new Error('source hex must encode 1..32 complete bytes');
  return BigInt('0x'+sourceHex).toString(10);
}
export function seedManifest({master,sourceHex,n}){
  if(sourceHex!==undefined){
    const exact=sourceHexToMaster(sourceHex);
    if(master!==undefined&&master!==exact)throw new Error('master differs from source bytes');
    master=exact;
  }
  return {seedDraw:{master,n,...(sourceHex===undefined?{}:{sourceHex,sourceBytes:[...Buffer.from(sourceHex,'hex')]})},seeds:drawSeeds(master,n)};
}
export function validateSeedSource(draw){
  if(draw.sourceHex===undefined){if(draw.sourceBytes!==undefined)throw new Error('source bytes require source hex');return;}
  if(sourceHexToMaster(draw.sourceHex)!==draw.master||JSON.stringify([...Buffer.from(draw.sourceHex,'hex')])!==JSON.stringify(draw.sourceBytes))throw new Error('seed manifest source bytes/decimal mismatch');
}
