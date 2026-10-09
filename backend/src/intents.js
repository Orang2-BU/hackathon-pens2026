export const INTENT_CATALOG = Object.freeze([
  { id: 'account_risk_factors', question: 'Which measured factors and sourced evidence explain this account risk index?' },
  { id: 'bug_affected_accounts', question: 'Which accounts are linked to this bug by sourced active graph paths?' },
  { id: 'champion_changed', question: 'Did the account champion leave or change employment?' },
  { id: 'feature_promise_overdue', question: 'Which promised features are overdue according to dated evidence?' },
  { id: 'open_support_tickets', question: 'Which support tickets remain open and how old are they?' },
  { id: 'upcoming_renewal', question: 'Which contract renews next and when?' },
  { id: 'discount_precedent', question: 'What sourced prior decision is relevant to this discount or deal?' },
  { id: 'dashboard_mismatch', question: 'Does a dashboard health label conflict with measured factors?' },
  { id: 'last_interaction', question: 'When was the latest external customer interaction?' },
  { id: 'feature_usage', question: 'Which accounts use this feature and how much?' },
]);

export function selectIntent(answers, { minimum = 0.7, minimumGap = 0.15 } = {}) {
  if (!answers || typeof answers !== 'object' || Object.keys(answers).length !== INTENT_CATALOG.length) return { status: 'abstained', reason: 'Router output did not cover the complete intent catalog.' };
  const ranked = INTENT_CATALOG.map(({ id }) => answers[id]);
  if (ranked.some((answer) => !answer || answer.type !== 'noul' || !Number.isFinite(answer.noul) || answer.noul < 0 || answer.noul > 1)) {
    return { status: 'abstained', reason: 'Router output is incomplete or malformed.' };
  }
  const rankedIntents = INTENT_CATALOG.map(({ id }) => ({ id, probability: answers[id].noul })).sort((left, right) => right.probability - left.probability);
  if (rankedIntents[0].probability < minimum) return { status: 'abstained', reason: 'No supported intent reached the confidence threshold.' };
  if (rankedIntents[0].probability - rankedIntents[1].probability < minimumGap) return { status: 'abstained', reason: 'Intent is ambiguous.' };
  return { status: 'answered', intent: rankedIntents[0].id, confidence: rankedIntents[0].probability };
}

export function buildIntentQuestions() {
  return Object.fromEntries(INTENT_CATALOG.map(({ id, question }) => [id, { type: 'noul', instructions: `Does the user's question match this intent: ${question}` }]));
}

export function resolveEntity(question, entities) {
  if (typeof question !== 'string' || !Array.isArray(entities)) throw new TypeError('Question and entity catalog are required.');
  const normalized = question.normalize('NFKC').toLocaleLowerCase();
  const matches = entities.filter((entity) => [entity.id, entity.name].filter(Boolean)
    .some((value) => {
      const candidate = String(value).normalize('NFKC').toLocaleLowerCase();
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      return new RegExp(`(?<![\\p{L}\\p{N}_-])${escaped}(?![\\p{L}\\p{N}_-])`, 'u').test(normalized)
        || (normalized.length >= 3 && candidate.startsWith(`${normalized} `));
    }));
  const unique = [...new Map(matches.map((entity) => [entity.id, entity])).values()];
  if (unique.length === 1) return { status: 'resolved', entity: unique[0] };
  if (unique.length > 1) return { status: 'ambiguous', candidates: unique.slice(0, 5) };
  return { status: 'missing', candidates: [] };
}

export function createGraphAnswer({ question, businessAsOf, graphRevision, intent, evidence, limitations = [] }) {
  if (!question || !businessAsOf || !graphRevision) throw new TypeError('Question, snapshot date and graph revision are required.');
  if (intent?.status !== 'answered') return {
    status: 'abstained', intent: null, businessAsOf, graphRevision,
    text: intent?.reason ?? 'I cannot map this question to a supported intent.', facts: [], citations: [], paths: [], limitations,
  };
  if (!evidence || !Array.isArray(evidence.facts) || !Array.isArray(evidence.citations) || evidence.facts.length === 0 || evidence.citations.length === 0) return {
    status: 'abstained', intent: intent.intent, businessAsOf, graphRevision,
    text: 'Insufficient sourced evidence is available to answer this question.', facts: [], citations: [], paths: [], limitations,
  };
  return {
    status: 'answered', intent: intent.intent, businessAsOf, graphRevision,
    text: evidence.text ?? 'The available sourced facts are listed below.',
    facts: evidence.facts, citations: evidence.citations, paths: evidence.paths ?? [], limitations,
  };
}
