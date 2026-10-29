'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {isUtf8}=require('node:buffer');
const root=path.resolve(__dirname,'..');
const manifest=path.join(root,'SHA256SUMS.txt');
const excluded=new Set(['.git','node_modules','coverage','logs','.npm-cache','.aws','.codex','.agents']);
const examples=new Set(['.env.example','.env.compose.example','.env.integration.example']);
const binary=new Set(['.png','.jpg','.jpeg','.gif','.pdf','.docx','.zip']);
function digest(file) {
  let content=fs.readFileSync(path.join(root,file));
  if(!binary.has(path.extname(file).toLowerCase()) && isUtf8(content))
    content=Buffer.from(content.toString('utf8').replace(/\r\n/g,'\n'));
  return createHash('sha256').update(content).digest('hex');
}
function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(excluded.has(entry.name) || entry.isSymbolicLink()) return [];
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) return walk(full);
    if(entry.name==='SHA256SUMS.txt' || entry.name.endsWith('.log') ||
      (entry.name.startsWith('.env') && !examples.has(entry.name))) return [];
    return [path.relative(root,full).split(path.sep).join('/')];
  });
}
if(process.argv.includes('--write')) {
  const files=walk(root).sort();
  fs.writeFileSync(manifest,'# Texto UTF-8 normalizado para LF; binarios em bytes originais.\n'+
    files.map(file=>`${digest(file)}  ${file}`).join('\n')+'\n');
  console.log(`Manifesto atualizado: ${files.length} arquivos; .env e artefatos temporarios excluidos.`);
} else {
  let count=0,failures=0;
  for(const line of fs.readFileSync(manifest,'utf8').split(/\r?\n/)) {
    const match=/^([a-f0-9]{64}) {2}(.+)$/.exec(line);
    if(!match) continue;
    const [,expected,file]=match;
    const resolved=path.resolve(root,file);
    if(!resolved.startsWith(root+path.sep) || !fs.existsSync(resolved) || digest(file)!==expected) {
      console.error('Divergencia:',file);failures++;
    }
    count++;
  }
  console.log(`Checksums: ${count} arquivos, ${failures} divergencias.`);
  process.exitCode=failures?1:0;
}
