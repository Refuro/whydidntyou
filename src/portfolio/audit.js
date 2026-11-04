import {Worker} from 'node:worker_threads';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {drawSeeds} from '../validate.js';
import {readRecords} from '../durable.js';
import {constructionSummary} from '../construction-ledger.js';
import {sourceIdentity} from '../source-identity.js';
import {make as historical,publicEvidence} from '../domains/invariantGame-b2.js';
import {MEMBERS,REGISTRATION,fitPublic,scorePrepared} from './run.js';
export const AUDIT=Object.freeze({master:'2026110304',proposalsPerFamily:512,families:['F-count','F-abelian','F-nonabelian','F-monoid'],nonabelianVariants:['S3','Q8','D4','A4'],monoidPoints:[3,4],policy:'fixed 512 proposals per requested family; variants cycle by proposal index; no replacement; construction for every family finishes before the first portfolio fit',independentChallenger:'pending external B4 review; this is the builder audit, not an independent challenge or freeze'});
function worker(data){return new Promise((resolve,reject)=>{const w=new Worker(new URL('./audit-worker.js',import.meta.url),{workerData:data});let done=false;w.on('message',m=>{if(m.type==='error')reject(new Error(m.error));else if(m.type==='complete'){done=true;console.log(JSON.stringify(m));resolve(m);}else console.log(JSON.stringify(m));});w.on('error',reject);w.on('exit',code=>{if(!done)reject(new Error('audit worker exited '+code));});});}
export function summarizeAudit(directory){
  const acceptance={},byRequested={},byEffective={},failures={},curves={};let worlds=0;
  const group=(map,name,row)=>{
    const g=map[name]??={worlds:0,members:{},oracleSuccesses:0,selectorSuccesses:0};g.worlds++;g.oracleSuccesses+=Number(row.oraclePortfolio.sealed.accuracy>=.95);g.selectorSuccesses+=Number(row.implementableSelector.sealedAccuracy>=.95);
    for(const r of row.rows){const m=g.members[r.id]??={worlds:0,sealedSuccesses:0,naturalSuccesses:0,sealedAccuracySum:0,naturalAccuracySum:0,fitOperations:0,fitMs:0,scoringMs:0,fitUnavailable:0};m.worlds++;m.sealedSuccesses+=Number(r.sealed.success);m.naturalSuccesses+=Number(r.natural.success);m.sealedAccuracySum+=r.sealed.accuracy;m.naturalAccuracySum+=r.natural.accuracy;m.fitOperations+=r.fit.primitiveCounts.operations;m.fitMs+=r.fit.ms;m.scoringMs+=r.sealed.resources.ms+r.natural.resources.ms;m.fitUnavailable+=Number(r.fit.status!=='fitted');}
  };
  for(const family of AUDIT.families){
    const ledger=readRecords(join(directory,family+'.construction.jsonl')),summary=constructionSummary(ledger),rows=readRecords(join(directory,family+'.portfolio.jsonl')).slice(1),expected=summary.entries.filter(e=>e.constructionValid);
    acceptance[family]=summary.counts[family];
    if(rows.length!==expected.length)throw new Error('incomplete portfolio audit for '+family);
    rows.forEach((r,i)=>{if(r.proposalIndex!==expected[i].index||r.worldDigest!==expected[i].worldDigest)throw new Error('portfolio row not bound to construction ledger');});
    for(const r of rows){worlds++;group(byRequested,family,r);group(byEffective,r.family,r);
      for(const m of r.rows){if(m.fit.reason){const k=m.id+'|'+m.fit.reason;failures[k]=(failures[k]??0)+1;}
        if(m.id.startsWith('bfs-')){const k=family+'|'+m.id,c=curves[k]??={worlds:0,accuracySum:0,successes:0,visitedNodes:0,testedPositions:0,maxDepth:0,exhaustionSum:0};c.worlds++;c.accuracySum+=m.sealed.accuracy;c.successes+=Number(m.sealed.success);c.visitedNodes+=m.sealed.resources.visitedNodes;c.testedPositions+=m.sealed.resources.testedPositions;c.maxDepth=Math.max(c.maxDepth,m.sealed.resources.maxDepth);c.exhaustionSum+=m.sealed.resources.budgetExhaustionFrequency;}}
    }
  }
  const coverageSatisfied=AUDIT.families.every(f=>(byRequested[f]?.worlds??0)>=200&&(byEffective[f]?.worlds??0)>=200);
  return {registration:AUDIT,portfolio:REGISTRATION,sourceHash:sourceIdentity(),proposed:AUDIT.proposalsPerFamily*AUDIT.families.length,worlds,coverageSatisfied,acceptance,byRequested,byEffective,failures,curves,liveModelCalls:0};
}
export async function runAudit(directory){
  directory=resolve(directory);mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'registration.json'),JSON.stringify({audit:AUDIT,portfolio:REGISTRATION,members:MEMBERS,sourceHash:sourceIdentity()},null,2)+'\n',{flag:'wx'});
  const seeds=drawSeeds(AUDIT.master,AUDIT.proposalsPerFamily),jobs=AUDIT.families.map(family=>({directory,family,proposals:seeds.map((seed,i)=>({seed,opts:{family,...(family==='F-nonabelian'?{algebra:AUDIT.nonabelianVariants[i%4]}:family==='F-monoid'?{points:AUDIT.monoidPoints[i%2]}:{})}}))}));
  await Promise.all(jobs.map(job=>worker({...job,phase:'construct'})));
  // Every proposed seed now has a durable disposition before any solver is fitted.
  await Promise.all(jobs.map(job=>worker({...job,phase:'score'})));
  const member=MEMBERS.find(m=>m.id==='positional-template'),historicalScores=[];
  const variants=[{family:'F-count'},{family:'F-abelian'},...AUDIT.nonabelianVariants.map(algebra=>({family:'F-nonabelian',algebra})),...AUDIT.monoidPoints.map(points=>({family:'F-monoid',points}))];
  for(const opts of variants)for(const seed of [1,2]){const world=historical(seed,opts),p=fitPublic(member,publicEvidence(world));historicalScores.push({seed,opts,worldDigest:world.worldDigest,fit:p.fit,score:scorePrepared(p,world.calibrationPairs,member)});}
  writeFileSync(join(directory,'historical-positional.json'),JSON.stringify(historicalScores,null,2)+'\n',{flag:'wx'});
  const summary=summarizeAudit(directory);writeFileSync(join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
  const md=['# B4 builder coverage audit','','Development evidence only. Independent solver challenge and B4 review remain pending; no portfolio freeze.','','| requested family | proposed | eligible | construction valid | acceptance |','|---|---:|---:|---:|---:|'];
  for(const [f,c]of Object.entries(summary.acceptance))md.push(`| ${f} | ${c.proposed} | ${c.eligible} | ${c.constructionValid} | ${(100*c.acceptanceRate).toFixed(2)}% |`);
  for(const [name,groups]of [['Requested family',summary.byRequested],['Effective family',summary.byEffective]]){md.push('','## '+name,'','Success means accuracy >=95% within one construction-valid world. Natural and challenge scores are kept separate.','','| family | n | member | sealed successes | mean sealed accuracy | natural successes | mean fit operations | mean fit ms | mean scoring ms |','|---|---:|---|---:|---:|---:|---:|---:|---:|');for(const [f,g]of Object.entries(groups)){for(const [id,m]of Object.entries(g.members))md.push(`| ${f} | ${g.worlds} | ${id} | ${m.sealedSuccesses} | ${(100*m.sealedAccuracySum/m.worlds).toFixed(2)}% | ${m.naturalSuccesses} | ${(m.fitOperations/m.worlds).toFixed(0)} | ${(m.fitMs/m.worlds).toFixed(2)} | ${(m.scoringMs/m.worlds).toFixed(2)} |`);md.push(`| ${f} | ${g.worlds} | ORACLE portfolio | ${g.oracleSuccesses} | — | — | — | — | — |`,`| ${f} | ${g.worlds} | public selector | ${g.selectorSuccesses} | — | — | — | — | — |`);}}
  md.push('','## All retained BFS settings','','| requested family / setting | mean sealed accuracy | successful worlds | tested positions | visited nodes | maximum depth | mean exhaustion frequency |','|---|---:|---:|---:|---:|---:|---:|');
  for(const [k,c]of Object.entries(summary.curves))md.push(`| ${k.replace('|',' / ')} | ${(100*c.accuracySum/c.worlds).toFixed(2)}% | ${c.successes} | ${c.testedPositions} | ${c.visitedNodes} | ${c.maxDepth} | ${(100*c.exhaustionSum/c.worlds).toFixed(2)}% |`);
  md.push('','Historical positional-template accuracy: '+historicalScores.filter(r=>r.score.accuracy===1).length+'/16 worlds at 100%.','',`Coverage of at least 200 accepted worlds in every requested AND effective family: ${summary.coverageSatisfied}.`,'','Every proposed seed, defect, per-world fit, score and resource count is in the adjacent JSONL files. Regeneration uses the pinned source and seed/options; no defect is replaced.');
  writeFileSync(join(directory,'coverage.md'),md.join('\n')+'\n',{flag:'wx'});return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){runAudit(process.argv[2]??'docs/B4-EVIDENCE').then(s=>console.log(JSON.stringify({done:true,worlds:s.worlds,coverageSatisfied:s.coverageSatisfied,acceptance:s.acceptance}))).catch(e=>{console.error(e);process.exitCode=1;});}
