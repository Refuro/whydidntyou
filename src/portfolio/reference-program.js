import {readFileSync} from 'node:fs';
import {MEMBERS} from './members.js';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'');
// Explicit local sources only. Public registered catalogues are created INSIDE fit.
// Fit code is a quoted lazy function so inference does not initialize catalogues.
const fitBody=['../algebra.js','../invariant-features.js','./search.js','./features.js','./finite-state.js','./bfs.js','./registration.js','./reference-fit.js'].map(source).join('\n');
const functionSource=(path,name)=>{const text=source(path),start=text.indexOf('function '+name+'(');let begin=text.indexOf('{',text.indexOf(')',start)),depth=0,end=begin;for(;end<text.length;end++){if(text[end]==='{')depth++;if(text[end]==='}'&&!--depth)break;}return text.slice(start,end+1);};
// Inference deliberately loads only its registered member's prediction implementation.
const common=source('./reference-predict.js');
function inferenceSource(member){
  let body=common;
  if(['group-full','group-quotients','monoid-csp','grammar-cegis','positional-template','joint-coarse'].includes(member.id))body+= '\n'+functionSource('../algebra.js','fold');
  if(['count-linear','joint-coarse','nuisance-stumps'].includes(member.id))body+='\n'+source('../invariant-features.js').split('export ')[0];
  if(member.id==='nuisance-stumps')body+='\n'+functionSource('./features.js','nuisanceVector');
  if(member.search||member.id==='rewrite-normal-form')body+='\n'+source('./bfs.js');
  return 'var memberCounters={};\n'+body+'\nfunction predict(serialized,a,b){memberCounters={};return predictState(JSON.parse(serialized).state,a,b,memberCounters);}';
}
const programs=new Map();
export function referenceProgram(member){
  if(!MEMBERS.some(m=>m.id===member.id))throw new Error('unregistered reference member');
  if(!programs.has(member.id))programs.set(member.id,{format:'fit-predict-source-v2',fitSource:'const structuredClone=x=>JSON.parse(JSON.stringify(x));\n'+fitBody+'\nfunction fit(view){return JSON.stringify(fitPublic('+JSON.stringify(member)+',view));}',inferenceSource:inferenceSource(member)});
  return programs.get(member.id);
}
