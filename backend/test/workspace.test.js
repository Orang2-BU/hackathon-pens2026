import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAction, actionDto } from '../src/actions.js';
import { strongestParameter } from '../src/workspace.js';
import { createHttpServer } from '../src/server.js';
import { createAuth } from '../src/auth.js';
test('completed actions require an outcome, real dates and an owner; unknown status is rejected',()=>{
 const base={owner:'CSM',dueDate:'2026-10-20',status:'planned',note:'Investigate'};
 assert.equal(validateAction(base).outcome,null);
 for(const patch of [{status:'completed'},{dueDate:'2026-02-30'},{owner:''},{status:'approved'}])assert.throws(()=>validateAction({...base,...patch}),{code:'INVALID_INPUT'});
 assert.equal(validateAction({...base,status:'completed',outcome:'Customer confirmed a new contact.'}).outcome,'Customer confirmed a new contact.');
});
test('missing and excluded factors do not become zero-risk evidence or win precedent matching',()=>{
 const parameters=[{factor:'champion',normalizedValue:1,status:'excluded'},{factor:'service',normalizedValue:'0.8',status:'available'},{factor:'usage',normalizedValue:0.5,status:'partial'}];
 assert.equal(strongestParameter(parameters).factor,'service');
 assert.equal(strongestParameter([{factor:'unknown',normalizedValue:1,status:'available'},{factor:'usage',normalizedValue:null,status:'unavailable'}]),null);
});
test('action stuck state uses actual due date and leaves completed outcomes closed',()=>{
 const row={due_date:'2000-01-01',status:'in_progress'};
 assert.equal(actionDto(row).stuck,true);
 assert.equal(actionDto({...row,status:'completed'}).stuck,false);
});
test('leading factor accounts for measured partial coverage as the score formula does',()=>{
 const factors=[{factor:'promiseEngagement',normalizedValue:0.8,status:'partial',rawValue:{unmetPromiseCount:null,daysSinceExternalInteraction:72}},
 {factor:'payment',normalizedValue:0.8,status:'available'}];
 assert.equal(strongestParameter(factors).factor,'payment');
});
test('action writes enforce server identity and CSM permissions, and reject unauthenticated reads',async()=>{
 const auth=createAuth({demoPassword:'long demo password here',userPassword:'different user password here',sessionSecret:'a'.repeat(32),publicOrigin:'https://demo.example'});
 let captured;
 const server=createHttpServer({database:async()=>[],auth,writeService:{createAction:async input=>{captured=input;return {id:'a1'}}},readService:{listActions:async()=>({items:[]})}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
 assert.equal((await fetch(`${base}/api/actions`)).status,401);
 const body=JSON.stringify({decisionId:'d1',owner:'CSM',dueDate:'2026-10-20',status:'planned',note:'Inspect',actorId:'forged'});
 const headers={origin:'https://demo.example','content-type':'application/json',cookie:`tessera_session=${auth.issueSession(auth.authenticate('different user password here'))}`};
 assert.equal((await fetch(`${base}/api/actions`,{method:'POST',headers,body})).status,403);
 headers.cookie=`tessera_session=${auth.issueSession()}`;
 assert.equal((await fetch(`${base}/api/actions`,{method:'POST',headers,body})).status,200);
 assert.equal(captured.actorId,'demo-admin');
 }finally{await new Promise(r=>server.close(r));}
});
