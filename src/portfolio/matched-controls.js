import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadPublicDirectory,regenerateWorld} from './challenge-public.js';
import {runPortfolio,MEMBERS} from './run.js';
import {referenceProgram} from './reference-program.js';
import {scoreExternal} from './score-external.js';
import {sourceIdentity} from '../source-identity.js';
export async function matchedControls(publicDir,directory){
  directory=resolve(directory);mkdirSync(directory,{recursive:true});
  const corpus=loadPublicDirectory(publicDir);if(corpus.worlds.length!==1)throw new Error('matched control uses the single registered example export');
  const item=corpus.worlds[0],world=regenerateWorld(item.ledger,item.construction),builder=await runPortfolio(world),controls=[];
  for(const member of MEMBERS){
    const file=join(directory,member.id+'.solver.json');writeFileSync(file,JSON.stringify(referenceProgram(member),null,2)+'\n',{flag:'wx'});
    const result=await scoreExternal(file,publicDir,{outputDir:join(directory,'external')}),external=result.summary.worldResults[0],inside=builder.rows.find(r=>r.id===member.id);
    for(const stage of ['public','sealed','natural'])assert.equal(external[stage].accuracy,inside[stage].accuracy,member.id+' '+stage);
    assert.equal(external.fit.calls,1);assert.equal(inside.fit.calls,1);
    controls.push({member:member.id,matched:true,builder:inside,external,externalReport:result.report,solverArchive:result.solverArchive});
  }
  const summary={sourceHash:sourceIdentity(),worldDigest:world.worldDigest,exportVersion:corpus.index.exportVersion,scope:'builder reference programs through the external adapter; not an independent challenge',comparison:'identical source packages, public fit evidence, serialized-state contract, budgets and fresh contexts; timings are separate observations on the same host',members:controls.length,allMatched:true,controls,liveModelCalls:0};
  writeFileSync(join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await matchedControls(process.argv[2],process.argv[3]);
