import { buildIntentQuestions, resolveEntity, selectIntent } from './intents.js';
import { SCORING_EXPERIMENT } from './scoring.js';
import { PlanError } from './plans.js';

const SNAPSHOT='2026-10-01';
const templates={usage:'Check offline outlets for unsynced transactions, then review adoption with the account owner.',service:'Assign a technical owner, inspect the ticket and bug evidence, and agree on a fix timeline.',champion:'Confirm the current decision-maker and update stakeholder ownership before discussing renewal.',promiseEngagement:'Review outstanding commitments and agree on the next customer conversation.',payment:'Confirm billing contacts, outstanding payment issues and agreed payment terms.'};
function contribution(parameter) {
  let coverage=1;
  const raw=parameter.rawValue;
  if(parameter.status==='partial'&&raw&&typeof raw==='object') {
    if(parameter.factor==='usage'&&Number.isFinite(raw.coverageRecent)&&Number.isFinite(raw.coveragePrevious))coverage=Math.min(raw.coverageRecent,raw.coveragePrevious);
    if(parameter.factor==='promiseEngagement')coverage=[raw.unmetPromiseCount,raw.daysSinceExternalInteraction].filter(Number.isFinite).length/2;
  }
  return Number(parameter.normalizedValue)*SCORING_EXPERIMENT.weights[parameter.factor]*Math.max(0,Math.min(1,coverage));
}
export function strongestParameter(parameters) {
  return parameters.filter(p=>p.normalizedValue!==null && Number.isFinite(Number(p.normalizedValue)) && Number(p.normalizedValue)>=0 && Number(p.normalizedValue)<=1 && Object.hasOwn(SCORING_EXPERIMENT.weights,p.factor) && ['available','partial'].includes(p.status))
    .sort((a,b)=>contribution(b)-contribution(a))[0] ?? null;
}
const groupOf=file=>file==='interactions.jsonl'?'interactions':/support|bugs|releases/.test(file)?'support':/usage|outlets|features/.test(file)?'usage':/contracts/.test(file)?'billing':/decision/.test(file)?'decisions':'crm';
function nodeDto(row) {
  const p=row.properties??{};
  return {id:row.id,type:row.type,key:row.external_key,label:p.nama??p.judul??p.nama_fitur??p.keputusan??row.external_key,
    details:Object.fromEntries(['status','tipe','tanggal','dibuat','versi_aplikasi','versi_terdampak','status_janji','fitur_dijanjikan','champion_contact_id','tanggal_renewal','account_id_saat_ini','jabatan_saat_ini','mulai','selesai','organisasi','target_awal','target_terkini'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))};
}
function citationDto(row) {
  const p=row.payload??{};
  const field=['isi','body','deskripsi','keputusan','alasan','ringkasan','judul','catatan'].find(k=>typeof p[k]==='string'&&p[k].length);
  const quote=field?p[field].slice(0,800):null;
  return {id:row.id,file:row.file_name,group:groupOf(row.file_name),recordId:row.external_id??String(row.record_number),recordHash:row.record_hash,
    occurredAt:row.occurred_at,recordedAt:row.created_at,synthetic:true,quote,field:field??null,span:quote?{start:0,end:quote.length}:null};
}
export function createWorkspaceService(database, readService, jev=null) {
  async function evidence(identifier, depth=2) {
    const [root]=await database`SELECT n.id,n.type,n.external_key,n.properties,n.dataset_revision_id FROM nodes n JOIN dataset_revisions dr ON dr.id=n.dataset_revision_id WHERE dr.status='published' AND (n.external_key=${identifier} OR n.id=${identifier}) ORDER BY dr.published_at DESC LIMIT 1`;
    if (!root) throw new PlanError('NOT_FOUND','Graph entity not found.');
    const nodes=new Map([[root.id,nodeDto(root)]]),edges=new Map(),sourceIds=new Set();
    let frontier=[root.id],truncated=false;
    for(let i=0;i<depth&&frontier.length;i++) {
      const rows=await database`SELECT e.id,e.type,e.source_node_id,e.target_node_id,e.relation_kind,e.reason,e.status,e.valid_from::text,e.valid_to::text,
        sn.type AS s_type,sn.external_key AS s_key,sn.properties AS s_properties,
        tn.type AS t_type,tn.external_key AS t_key,tn.properties AS t_properties,
        ARRAY(SELECT source_record_id FROM edge_sources WHERE edge_id=e.id) AS source_ids
        FROM edges e JOIN nodes sn ON sn.id=e.source_node_id JOIN nodes tn ON tn.id=e.target_node_id
        WHERE e.dataset_revision_id=${root.dataset_revision_id} AND (e.source_node_id=ANY(${frontier}::text[]) OR e.target_node_id=ANY(${frontier}::text[]))
        AND e.status IN ('active','review') AND (e.valid_from IS NULL OR e.valid_from<=${SNAPSHOT}) AND (e.valid_to IS NULL OR ${SNAPSHOT}<e.valid_to)
        ORDER BY CASE
          WHEN e.type IN ('bug_candidate','ticket_bug','account_champion','contact_current_account','decision_feature_promise','decision_account','contract_account') THEN 0
          WHEN e.type='ticket_account' AND sn.properties->>'status'='Terbuka' THEN 1
          WHEN e.type='employment' THEN 2 ELSE 3 END,e.id LIMIT 121`;
      if(rows.length>120)truncated=true;
      const next=[];
      for(const r of rows.slice(0,120)) {
        if(!r.source_ids?.length)continue;
        const newIds=[r.source_node_id,r.target_node_id].filter(id=>!nodes.has(id));
        // Reserve room for multi-hop evidence instead of filling the view with direct neighbors.
        const nodeLimit=i===0&&depth>1?30:60;
        if(nodes.size+newIds.length>nodeLimit){truncated=true;continue;}
        for(const [id,prefix]of[[r.source_node_id,'s'],[r.target_node_id,'t']])if(!nodes.has(id)){nodes.set(id,nodeDto({id,type:r[`${prefix}_type`],external_key:r[`${prefix}_key`],properties:r[`${prefix}_properties`]}));next.push(id);}
        edges.set(r.id,{id:r.id,type:r.type,source:r.source_node_id,target:r.target_node_id,relationKind:r.relation_kind,status:r.status,reason:r.reason,validFrom:r.valid_from,validTo:r.valid_to,sourceRecordIds:r.source_ids});
        r.source_ids.forEach(id=>sourceIds.add(id));
      }
      frontier=next;
    }
    const sourceRows=sourceIds.size?await database`SELECT sr.id,sr.external_id,sr.record_number,sr.record_hash,sr.occurred_at,sr.payload,s.file_name,s.created_at FROM source_records sr JOIN sources s ON s.id=sr.source_id WHERE sr.id=ANY(${[...sourceIds]}::text[]) ORDER BY s.file_name,sr.record_number LIMIT 400`:[];
    return {rootId:root.id,datasetRevision:root.dataset_revision_id,businessAsOf:SNAPSHOT,recordedAsOf:new Date().toISOString(),synthetic:true,nodes:[...nodes.values()],edges:[...edges.values()],citations:sourceRows.map(citationDto),truncated:truncated||sourceRows.length===400,depth};
  }
  return {
    getEvidence:evidence,
    async dataStatus() {
      const [revision]=await database`SELECT id,published_at FROM dataset_revisions WHERE status='published' ORDER BY published_at DESC LIMIT 1`;
      if(!revision)return {datasetRevision:null,sources:[],nodes:[],edges:[],jev:null,synthetic:true};
      const sources=await database`SELECT file_name,row_count,sha256,created_at FROM sources WHERE dataset_revision_id=${revision.id} ORDER BY file_name`;
      const nodes=await database`SELECT type,count(*)::integer AS count FROM nodes WHERE dataset_revision_id=${revision.id} GROUP BY type`;
      const edges=await database`SELECT status,count(*)::integer AS count FROM edges WHERE dataset_revision_id=${revision.id} GROUP BY status`;
      const [jevStats]=await database`SELECT count(*)::integer AS calls,count(*) FILTER(WHERE status='failed')::integer AS errors,sum(input_tokens)::integer AS input_tokens,sum(output_tokens)::integer AS output_tokens,CASE WHEN count(cost)=count(*) AND count(*)>0 THEN sum(cost) ELSE NULL END AS cost FROM jev_runs`;
      return {datasetRevision:revision.id,publishedAt:revision.published_at,synthetic:true,sources:sources.map(r=>({file:r.file_name,rows:r.row_count,hash:r.sha256,recordedAt:r.created_at})),nodes,edges,jev:{configured:!!jev,calls:jevStats.calls,errors:jevStats.errors,inputTokens:jevStats.input_tokens,outputTokens:jevStats.output_tokens,cost:jevStats.cost}};
    },
    async recommendation(accountId) {
      const account=await readService.getAccount(accountId);
      if(!account)throw new PlanError('NOT_FOUND','Account not found.');
      const graph=await evidence(account.nodeId,2),top=strongestParameter(account.parameters);
      const cases=await database`SELECT d.id,d.reason,d.created_at,d.actor_id,pr.body,pr.context,n.external_key,
        ev.status AS action_status,ev.outcome
        FROM decisions d JOIN plan_revisions pr ON pr.id=d.plan_revision_id JOIN plans p ON p.id=pr.plan_id JOIN nodes n ON n.id=p.account_node_id
        LEFT JOIN actions a ON a.decision_id=d.id
        LEFT JOIN LATERAL (SELECT status,outcome FROM action_events WHERE action_id=a.id ORDER BY revision DESC LIMIT 1) ev ON true
        WHERE d.outcome='approved' AND pr.context->>'leadFactor'=${top?.factor??''}
        ORDER BY d.created_at DESC LIMIT 10`;
      const precedents=cases.map(r=>({id:r.id,origin:'app_decision',accountId:r.external_key,body:r.body,reason:r.reason,actorId:r.actor_id,createdAt:r.created_at,conditions:r.context.conditions??[],sourceRefs:r.context.sourceRefs??[],outcome:r.outcome??null,status:r.action_status??null,effectiveness:r.outcome?'Observed outcome recorded; causality is not established.':'Previously selected; effectiveness is unknown.'}));
      const historyNodes=graph.nodes.filter(n=>n.type==='decision');
      const groups=[...new Set(graph.citations.map(c=>c.group))];
      const experience=precedents.find(p=>p.outcome);
      const draft=experience?`Consider adapting the previously approved action from ${experience.accountId} (${experience.id}): ${experience.body} Verify the current account evidence before adopting it.`:top?templates[top.factor]??'Inspect the available evidence before choosing a response.':null;
      return {accountId,leadFactor:top?.factor??null,draft,
        reason:top?`${top.factor} has the largest measured weighted contribution (${Number(top.normalizedValue)*100} / 100).`: 'Measured factors are unavailable.',
        citations:graph.citations,precedents,datasetPrecedents:historyNodes,sourceGroups:groups,
        limitations:[...(groups.length<3?['Fewer than three source groups are available; inspect coverage before approval.']:[]),'Priority is heuristic, not a churn probability.','Similarity uses the same leading measured factor; it does not prove the same root cause.','Similar actions do not prove effectiveness.']};
    },
    async answerGraphQuestion(question) {
      if(!jev)return {status:'abstained',text:'Question routing is unavailable until Jev is configured. Explore the graph directly.',citations:[],paths:[],limitations:['jev_router_unavailable']};
      const routed=await jev.evaluate({state:{question},questions:buildIntentQuestions(),rubricVersion:'graph-intents-v1'});
      const intent=selectIntent(routed.answers);
      if(intent.status!=='answered')return {...intent,text:intent.reason,citations:[],paths:[]};
      const rows=await database`SELECT n.external_key,n.properties->>'nama' AS name FROM nodes n JOIN dataset_revisions dr ON dr.id=n.dataset_revision_id WHERE dr.status='published' AND n.type IN ('account','bug','feature') ORDER BY dr.published_at DESC LIMIT 200`;
      const resolved=resolveEntity(question,rows.map(r=>({id:r.external_key,name:r.name})));
      if(resolved.status!=='resolved')return {status:'abstained',intent:intent.intent,text:'Specify one account, bug or feature ID so the evidence can be scoped safely.',citations:[],paths:[]};
      const graph=await evidence(resolved.entity.id,3);
      const types={bug_affected_accounts:['account','ticket','bug'],champion_changed:['contact','account'],feature_promise_overdue:['decision','feature'],open_support_tickets:['ticket'],discount_precedent:['decision','deal'],last_interaction:['interaction'],feature_usage:['feature','account'],upcoming_renewal:['contract'],dashboard_mismatch:['account'],account_risk_factors:['account']};
      const facts=graph.nodes.filter(n=>types[intent.intent]?.includes(n.type));
      if(!facts.length||!graph.citations.length)return {status:'abstained',intent:intent.intent,text:'No sourced graph facts support this question.',citations:[],paths:[]};
      const account=/^C\d+$/u.test(resolved.entity.id)?await readService.getAccount(resolved.entity.id):null;
      const experience=account&&intent.intent==='discount_precedent'?await this.recommendation(account.id):null;
      const labels=facts.map(n=>`${n.key}: ${n.label}`).join('; ');
      const texts={
        account_risk_factors:account?`Priority score: ${account.priority.score??'unavailable'} (${account.priority.level??'unscored'}). Measured factors: ${account.parameters.map(p=>`${p.factor}: ${p.normalizedValue===null?'unavailable':`${Number(p.normalizedValue)*100}/100`} (${p.status})`).join('; ')}.`:null,
        bug_affected_accounts:`Connected accounts and issues: ${labels}. Derived/review links are candidates, not confirmed affected accounts.`,
        champion_changed:`Recorded contacts and account context: ${labels}. Inspect dated employment links before concluding that a champion moved.`,
        feature_promise_overdue:`Recorded decisions and features: ${labels}. Inspect promise status and dates; missing status does not establish an overdue promise.`,
        open_support_tickets:`Recorded tickets still marked open: ${facts.filter(n=>/terbuka|open/i.test(n.details.status??'')).map(n=>`${n.key}: ${n.label}`).join('; ')||'No open status is present in this bounded graph view'}.`,
        upcoming_renewal:account?`Renewal for ${account.name}: ${account.renewalDate??'unavailable'}. Annual contract revenue: ${account.annualValueIdr??'unavailable'} IDR; not a predicted loss.`:null,
        discount_precedent:`Historical decision/deal context: ${labels}.${experience?.precedents.length?` Application decisions with the same leading measured factor: ${experience.precedents.map(p=>`${p.id} (${p.accountId}): ${p.body}; reason: ${p.reason}; observed outcome: ${p.outcome??'not recorded'}`).join('; ')}.`:''} A prior selection is not proof that the intervention worked.`,
        dashboard_mismatch:account?`CRM health: ${account.dashboardHealth??'unavailable'}. Persisted priority: ${account.priority.score??'unavailable'} (${account.priority.level??'unscored'}). These are different measures; no historical health-score decline is inferred.`:null,
        last_interaction:`Recorded interactions: ${labels}. Dates are shown on nodes; absence of a response in this bounded dataset is not proof of no response elsewhere.`,
        feature_usage:`Feature/account relationships: ${labels}. This graph context alone does not quantify adoption or establish causality.`,
      };
      if(!texts[intent.intent])return {status:'abstained',intent:intent.intent,text:'Specify an account ID for this question.',citations:[],paths:[]};
      return {status:'answered',intent:intent.intent,text:texts[intent.intent],facts,citations:graph.citations,paths:graph.edges,graph,precedents:experience?.precedents??[],parameters:account?.parameters??[],priority:account?.priority??null,renewalDate:account?.renewalDate??null,dashboardHealth:account?.dashboardHealth??null,limitations:['Snapshot: 1 Oct 2026. Candidate relationships require review.',...(graph.truncated?['Graph is bounded; open a specific node to continue.']:[])]};
    },
  };
}
