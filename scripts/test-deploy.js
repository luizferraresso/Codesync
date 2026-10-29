'use strict';
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const args=['run','--rm',
  '--mount',`type=bind,source=${path.join(root,'aws')},target=/source,readonly`,
  '--mount',`type=bind,source=${path.join(root,'tests/deploy')},target=/tests,readonly`,
  'bash:5','bash','/tests/deploy-script.test.sh'];
const result=spawnSync('docker',args,{stdio:'inherit'});
if(result.error) console.error(result.error.message);
process.exitCode=result.status??1;
