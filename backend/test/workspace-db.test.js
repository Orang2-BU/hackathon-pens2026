import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import postgres from 'postgres';
import { applyMigrations } from '../src/migrations.js';
import { createPostgresReadService } from '../src/read-repository.js';
import { createWorkspaceService } from '../src/workspace.js';
import { createPlanService } from '../src/plan-service.js';
import { createActionService } from '../src/actions.js';
import { createFeedbackService } from '../src/feedback.js';
import { createHttpServer } from '../src/server.js';
import { createAuth } from '../src/auth.js';
import { INTENT_CATALOG } from '../src/intents.js';

const url=process.env.TEST_DATABASE_URL;
if(!url || !/^postgres:\/\/[^/]+\/tessera_test_[a-z_]+$/u.test(url))throw new Error('TEST_DATABASE_URL must target an explicitly disposable tessera_test_* database.');

test('workspace SQL, persistent decision, optimistic action events, memory and server auth work together',async()=>{
 const admin=postgres(url,{max:1,onnotice:()=>{}});
 let runtime,server;
 try {
  await admin.unsafe(`DO $$ BEGIN CREATE ROLE tessera_migrator NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE ROLE tessera_runtime NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE ROLE tessera_test_runtime LOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    GRANT tessera_runtime TO tessera_test_runtime;
    DROP SCHEMA public CASCADE; CREATE SCHEMA public;
    GRANT USAGE,CREATE ON SCHEMA public TO tessera_migrator; GRANT USAGE ON SCHEMA public TO tessera_runtime;`);
  await applyMigrations(admin,new URL('../db/migrations/',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u,'$1'));
  await admin.unsafe(await readFile(new URL('../db/roles.sql',import.meta.url),'utf8'));
  await admin`INSERT INTO dataset_revisions(id,source_hash,status,published_at) VALUES ('revision:test','fixture-only','published',now())`;
  const properties=[['n-account-1','account','C01',{nama:'Test account one',tipe:'pelanggan',health_score_dashboard:'Hijau'}],['n-account-2','account','C02',{nama:'Test account two',tipe:'pelanggan'}],['n-ticket','ticket','T-TEST',{judul:'Test offline ticket',status:'Terbuka'}],['n-bug','bug','BUG-TEST',{judul:'Test sync candidate'}],['n-contract','contract','CT-TEST',{status:'active'}],['n-decision','decision','DEC-TEST',{judul:'Test historical decision'}]];
  for(const[id,type,key,p]of properties)await admin`INSERT INTO nodes(id,dataset_revision_id,type,external_key,properties) VALUES (${id},'revision:test',${type},${key},${admin.json(p)})`;
  const files=['crm_accounts.csv','support_tickets.csv','contracts_billing.csv','decision_log.csv'];
  for(const[fileIndex,file]of files.entries()){
   await admin`INSERT INTO sources(id,dataset_revision_id,file_name,sha256,row_count) VALUES (${`s-${fileIndex}`},'revision:test',${file},${'a'.repeat(64)},1)`;
   const payload=fileIndex===2?{account_id:'C01',nilai_tahunan:'150000000',tanggal_renewal:'2026-11-05'}:{deskripsi:'Test source text. This is an integration fixture, not KasirNusa data.'};
   await admin`INSERT INTO source_records(id,source_id,record_number,record_hash,payload) VALUES (${`sr-${fileIndex}`},${`s-${fileIndex}`},1,${'b'.repeat(64)},${admin.json(payload)})`;
  }
  const edgeInputs=[['e-account-ticket','ticket_account','n-ticket','n-account-1','hard','active',1],['e-ticket-bug','bug_candidate','n-ticket','n-bug','derived','review',1],['e-other-bug','account_issue','n-account-2','n-bug','hard','active',0],['e-contract','contract_account','n-contract','n-account-1','hard','active',2],['e-decision','decision_account','n-decision','n-account-1','hard','active',3]];
  for(const[id,type,source,target,kind,status,fileIndex]of edgeInputs){await admin`INSERT INTO edges(id,dataset_revision_id,type,source_node_id,target_node_id,relation_kind,status,reason) VALUES (${id},'revision:test',${type},${source},${target},${kind},${status},${kind==='derived'?'Fixture candidate; not causal proof.':null})`;await admin`INSERT INTO edge_sources(edge_id,source_record_id) VALUES (${id},${`sr-${fileIndex}`})`;}
  await admin`INSERT INTO score_runs(id,dataset_revision_id,formula_version,parameters) VALUES ('score-test','revision:test','risk-heuristic-v1',${admin.json({})})`;
  for(const id of ['n-account-1','n-account-2']){
   await admin`INSERT INTO account_factors(id,dataset_revision_id,account_node_id,score_run_id,factor,normalized_value,status,evidence) VALUES (${`factor-${id}`},'revision:test',${id},'score-test','service',0.8,'available',${admin.json(['sr-1'])})`;
   await admin`INSERT INTO score_run_results(id,score_run_id,account_node_id,score,status,coverage,level,level_reason,weighted_value_idr) VALUES (${`result-${id}`},'score-test',${id},40,'complete',100,'High','Integration fixture level',60000000)`;
  }
  runtime=postgres(url.replace('postgres@','tessera_test_runtime@'),{max:1,onnotice:()=>{}});
  const read=createPostgresReadService(runtime),plans=createPlanService(runtime),actions=createActionService(runtime),feedback=createFeedbackService(runtime);
  const workspace=createWorkspaceService(runtime,read);
  const graph=await workspace.getEvidence('C01',3);
  assert(graph.nodes.some(n=>n.key==='C02'));
  assert(graph.edges.some(e=>e.relationKind==='derived'&&e.status==='review'));
  assert.equal(graph.citations.find(c=>c.id==='sr-1').quote,'Test source text. This is an integration fixture, not KasirNusa data.');
  const recommendation=await workspace.recommendation('C01');
  assert.equal(recommendation.leadFactor,'service');assert.equal(recommendation.sourceGroups.length,3);
  const p=await plans.createPlan({accountNodeId:'C01',body:recommendation.draft,actorId:'demo-admin'});
  assert.equal(p.revision.context.leadFactor,'service');
  const revised=await plans.revisePlan({planId:p.planId,expectedRevision:1,body:'Inspect sync with the technical owner.',actorId:'demo-admin',deviationReason:'Need customer confirmation.'});
  await assert.rejects(plans.decidePlan({planRevisionId:p.revision.id,idempotencyKey:'old-revision',outcome:'approved',reason:'stale',actorId:'demo-admin'}),{code:'CONFLICT'});
  const input={planRevisionId:revised.id,idempotencyKey:'test-approval',outcome:'approved',reason:'Checked sources and ownership.',actorId:'demo-admin'};
  const decision=await plans.decidePlan(input);
  assert.equal((await plans.decidePlan(input)).id,decision.id);
  await assert.rejects(plans.decidePlan({...input,reason:'Changed reason'}),{code:'CONFLICT'});
  assert.equal((await read.getAccount('C01')).plans.at(-1).decision.id,decision.id);
  const action=await actions.createAction({decisionId:decision.id,owner:'Test CSM',dueDate:'2026-10-20',status:'blocked',note:'Waiting for source confirmation.',actorId:'demo-admin'});
  await assert.rejects(actions.updateAction({actionId:action.id,expectedRevision:99,owner:'Test CSM',dueDate:'2026-10-20',status:'in_progress',note:'Continue',actorId:'demo-admin'}),{code:'CONFLICT'});
  assert.equal((await actions.listActions()).items[0].stuck,true);
  await actions.updateAction({actionId:action.id,expectedRevision:1,owner:'Replacement CSM',dueDate:'2026-10-20',status:'completed',note:'Customer confirmed the fix.',outcome:'Customer reported sync resumed; renewal outcome unknown.',actorId:'replacement-csm'});
  assert.equal((await actions.actionHistory(action.id)).items.length,2);
  const memory=await workspace.recommendation('C02');
  assert.equal(memory.precedents[0].id,decision.id);assert(memory.draft.includes(decision.id));assert.equal(memory.precedents[0].conditions[0].factor,'service');assert.match(memory.precedents[0].outcome,/renewal outcome unknown/u);
  await assert.rejects(runtime`UPDATE decisions SET reason='tampered' WHERE id=${decision.id}`);
  await assert.rejects(runtime`UPDATE action_events SET note='tampered' WHERE action_id=${action.id}`);
  const f=await feedback.submitFeedback({accountNodeId:'n-account-1',body:'Review this separately.',actorId:'demo-user'});
  await feedback.replyToFeedback({feedbackId:f.id,body:'Reviewed without changing score.',actorId:'demo-admin'});
  assert.equal((await feedback.getFeedback(f.id)).replies.length,1);
  const router={evaluate:async()=>({answers:Object.fromEntries(INTENT_CATALOG.map(i=>[i.id,{type:'noul',noul:i.id==='account_risk_factors'?0.99:0.01}]))})};
  const answer=await createWorkspaceService(runtime,read,router).answerGraphQuestion('Explain the risk for C01');
  assert.equal(answer.status,'answered');assert.equal(answer.parameters[0].factor,'service');
  assert.equal((await workspace.answerGraphQuestion('Explain C01')).status,'abstained');
  const precedentRouter={evaluate:async()=>({answers:Object.fromEntries(INTENT_CATALOG.map(i=>[i.id,{type:'noul',noul:i.id==='discount_precedent'?0.99:0.01}]))})};
  const precedentAnswer=await createWorkspaceService(runtime,read,precedentRouter).answerGraphQuestion('Prior decisions for C01');
  assert.equal(precedentAnswer.status,'answered');
  assert(precedentAnswer.precedents.some(p=>p.id===decision.id));
  assert(precedentAnswer.text.includes(decision.id));
  const auth=createAuth({demoPassword:'fixture administrator password',sessionSecret:'test-only-secret-'.repeat(3),publicOrigin:'http://localhost:3025',secureCookies:false});
  server=createHttpServer({database:runtime,auth,readService:{...read,...workspace,...actions,...feedback},writeService:{...plans,...actions,...feedback}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{origin:'http://localhost:3025','content-type':'application/json'},body:JSON.stringify({password:'fixture administrator password'})});
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${base}/api/actions`,{headers:{cookie}})).status,200);
  assert.equal((await fetch(`${base}/api/accounts/C01/evidence?depth=5`)).status,400);
  assert.equal((await fetch(`${base}/api/data/status`)).status,200);
 }finally{if(server)await new Promise(r=>server.close(r));await runtime?.end();await admin.end();}
});
