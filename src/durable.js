import {openSync,writeFileSync,fsyncSync,closeSync,renameSync,readFileSync} from 'node:fs';
export function durableAppend(path,value,{exclusive=false}={}){
  const fd=openSync(path,exclusive?'wx':'a');
  try{writeFileSync(fd,JSON.stringify(value)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
}
export function durableReplace(path,records){
  const pending=path+'.pending',fd=openSync(pending,'w');
  try{writeFileSync(fd,records.map(JSON.stringify).join('\n')+'\n');fsyncSync(fd);}finally{closeSync(fd);}
  renameSync(pending,path);
}
export function readRecords(path){
  const text=readFileSync(path,'utf8');
  if(!text.endsWith('\n'))throw new Error('partial final JSON record or missing durable record terminator');
  return text.slice(0,-1).split('\n').map(JSON.parse);
}
