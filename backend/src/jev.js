import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createJevRunStore } from './jev-store.js';

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MAX_REQUEST_BYTES = 256_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1000];

export class JevError extends Error {
  constructor(code, message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = 'JevError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function createConfiguredJevClient({ database, env = process.env, ...options }) {
  const maxRequests = Number(env.JEV_MAX_REQUESTS ?? '1000');
  return createJevClient({
    apiKey: env.JEV_API_KEY,
    store: createJevRunStore(database),
    maxRequests,
    ...options,
  });
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function validateQuestion(name, question) {
  if (!/^[a-z][a-z0-9_]{0,63}$/u.test(name) || !question || typeof question !== 'object') {
    throw new JevError('invalid_request', 'Jev question name or shape is invalid.');
  }
  if (!['noul', 'score', 'choice'].includes(question.type)) {
    throw new JevError('invalid_request', `Unsupported Jev question type for ${name}.`);
  }
  if (question.instructions !== undefined && (typeof question.instructions !== 'string' || question.instructions.length > 2000)) {
    throw new JevError('invalid_request', `Jev instructions for ${name} are invalid.`);
  }
  if (question.type === 'score' && (!Array.isArray(question.criteria) || question.criteria.length < 1 || question.criteria.length > 10)) {
    throw new JevError('invalid_request', `Jev score criteria for ${name} are invalid.`);
  }
  if (question.type === 'choice' && (!question.criteria || typeof question.criteria !== 'object' || Array.isArray(question.criteria) || Object.keys(question.criteria).length < 2)) {
    throw new JevError('invalid_request', `Jev choice criteria for ${name} are invalid.`);
  }
}

function validateRequest(state, questions, model, rubricVersion) {
  if (state === null || !['string', 'object'].includes(typeof state)) {
    throw new JevError('invalid_request', 'Jev state must be a string, object, or array.');
  }
  if (!questions || typeof questions !== 'object' || Array.isArray(questions) || Object.keys(questions).length === 0 || Object.keys(questions).length > 32) {
    throw new JevError('invalid_request', 'Jev questions must be a non-empty map with at most 32 entries.');
  }
  for (const [name, question] of Object.entries(questions)) validateQuestion(name, question);
  if (typeof model !== 'string' || !model.trim() || model.length > 100) throw new JevError('invalid_request', 'Jev model is invalid.');
  if (typeof rubricVersion !== 'string' || !rubricVersion.trim() || rubricVersion.length > 100) throw new JevError('invalid_request', 'Jev rubric version is required.');
  const payload = { model, state, questions };
  const body = JSON.stringify(payload);
  if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) throw new JevError('request_too_large', 'Jev request exceeds the configured byte limit.');
  return { body, canonical: JSON.stringify(stableValue({ state, questions })) };
}

function isFiniteUnit(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateProbabilityMap(probabilities, expectedKeys) {
  if (!probabilities || typeof probabilities !== 'object' || Array.isArray(probabilities)) return false;
  const keys = Object.keys(probabilities);
  if (keys.length !== expectedKeys.length || keys.some((key) => !expectedKeys.includes(key))) return false;
  if (!keys.every((key) => isFiniteUnit(probabilities[key]))) return false;
  const total = keys.reduce((sum, key) => sum + probabilities[key], 0);
  return Math.abs(total - 1) <= 0.05;
}

export function validateJevResponse(response, questions) {
  if (!response || typeof response !== 'object' || typeof response.model !== 'string' || !response.model.trim()) {
    throw new JevError('invalid_response', 'Jev response is missing its model identifier.');
  }
  if (!response.answers || typeof response.answers !== 'object' || Array.isArray(response.answers)) {
    throw new JevError('invalid_response', 'Jev response is missing its answers map.');
  }
  const answerNames = Object.keys(response.answers).sort();
  const questionNames = Object.keys(questions).sort();
  if (answerNames.length !== questionNames.length || answerNames.some((name, index) => name !== questionNames[index])) {
    throw new JevError('invalid_response', 'Jev response answer keys do not match the request.');
  }
  if (!response.usage || !Number.isInteger(response.usage.input_tokens) || response.usage.input_tokens < 0
    || !Number.isInteger(response.usage.output_tokens) || response.usage.output_tokens < 0) {
    throw new JevError('invalid_response', 'Jev response usage is invalid.');
  }

  const answers = {};
  for (const [name, question] of Object.entries(questions)) {
    const answer = response.answers[name];
    if (!answer || answer.type !== question.type) throw new JevError('invalid_response', `Jev answer ${name} has the wrong type.`);
    if (question.type === 'noul') {
      if (!isFiniteUnit(answer.noul)) throw new JevError('invalid_response', `Jev noul answer ${name} is outside [0, 1].`);
      answers[name] = { type: 'noul', noul: answer.noul };
    } else if (question.type === 'score') {
      const keys = question.criteria.map((_, index) => String(index));
      if (!Number.isFinite(answer.score) || answer.score < 0 || answer.score > question.criteria.length - 1 || !isFiniteUnit(answer.confidence)
        || !validateProbabilityMap(answer.probabilities, keys)) {
        throw new JevError('invalid_response', `Jev score answer ${name} is invalid.`);
      }
      answers[name] = { type: 'score', score: answer.score, confidence: answer.confidence, probabilities: answer.probabilities };
    } else {
      const keys = Object.keys(question.criteria);
      if (!keys.includes(answer.choice) || !isFiniteUnit(answer.confidence)
        || !validateProbabilityMap(answer.probabilities, keys)) {
        throw new JevError('invalid_response', `Jev choice answer ${name} is invalid.`);
      }
      answers[name] = { type: 'choice', choice: answer.choice, confidence: answer.confidence, probabilities: answer.probabilities };
    }
  }

  return {
    model: response.model,
    answers,
    usage: { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens },
  };
}

function primitiveFor(questions) {
  const types = new Set(Object.values(questions).map(({ type }) => type));
  return types.size === 1 ? [...types][0] : 'mixed';
}

function cacheKey(input, model, rubricVersion, primitive) {
  return {
    inputHash: createHash('sha256').update(input).digest('hex'),
    modelRequested: model,
    rubricVersion,
    primitive,
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createJevClient({ apiKey, store, fetchImpl = fetch, maxRequests = 1000, maxConcurrent = 4, now = () => performance.now(), wait = delay }) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new JevError('missing_api_key', 'JEV_API_KEY is required for Jev calls.');
  if (!store || typeof store.getCached !== 'function' || typeof store.saveRun !== 'function') throw new TypeError('A Jev run store is required.');
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || !Number.isInteger(maxConcurrent) || maxConcurrent < 1) throw new RangeError('Jev request and concurrency limits must be positive integers.');

  let requestsStarted = 0;
  let active = 0;

  return {
    async evaluate({ state, questions, model = 'jev-latest', rubricVersion }) {
      const { body, canonical } = validateRequest(state, questions, model, rubricVersion);
      const primitive = primitiveFor(questions);
      const key = cacheKey(canonical, model, rubricVersion, primitive);
      const cached = await store.getCached(key);
      if (cached) return { ...cached.response, metrics: { cached: true, latencyMs: cached.latency_ms, inputTokens: cached.input_tokens, outputTokens: cached.output_tokens } };
      if (requestsStarted >= maxRequests) throw new JevError('request_budget_exceeded', 'Jev request budget is exhausted.');
      if (active >= maxConcurrent) throw new JevError('concurrency_limit', 'Jev concurrency limit is reached.', { retryable: true });

      active += 1;
      const startedAt = now();
      let finalError;
      try {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
          if (requestsStarted >= maxRequests) {
            finalError = new JevError('request_budget_exceeded', 'Jev request budget is exhausted.');
            break;
          }
          requestsStarted += 1;
          try {
            const response = await fetchImpl(ENDPOINT, {
              method: 'POST',
              headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
              body,
              signal: AbortSignal.timeout(60_000),
            });
            if (!response.ok) {
              const retryable = response.status === 429 || response.status >= 500;
              throw new JevError('provider_http_error', `Jev request failed with HTTP ${response.status}.`, { status: response.status, retryable });
            }
            if (!response.headers.get('content-type')?.includes('application/json')) {
              throw new JevError('invalid_response', 'Jev response content type is not JSON.');
            }
            const contentLength = Number(response.headers.get('content-length') ?? 0);
            if (contentLength > 1_000_000) throw new JevError('invalid_response', 'Jev response exceeds the configured size limit.');
            const text = await response.text();
            if (Buffer.byteLength(text, 'utf8') > 1_000_000) throw new JevError('invalid_response', 'Jev response exceeds the configured size limit.');
            let raw;
            try { raw = JSON.parse(text); } catch { throw new JevError('invalid_response', 'Jev response is not valid JSON.'); }
            const result = validateJevResponse(raw, questions);
            const latencyMs = Math.max(0, Math.round(now() - startedAt));
            const output = { ...result, metrics: { cached: false, latencyMs, inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens, estimatedCostUsd: null } };
            await store.saveRun({ id: randomUUID(), ...key, model: result.model, status: 'succeeded', latencyMs, inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens, errorCode: null, response: result });
            return output;
          } catch (error) {
            finalError = error instanceof JevError ? error : new JevError('provider_network_error', 'Jev network request failed.', { retryable: true });
            if (!finalError.retryable || attempt === MAX_RETRIES || requestsStarted >= maxRequests) break;
            await wait(RETRY_DELAYS[attempt]);
          }
        }

        const latencyMs = Math.max(0, Math.round(now() - startedAt));
        await store.saveRun({ id: randomUUID(), ...key, model, status: 'failed', latencyMs, inputTokens: null, outputTokens: null, errorCode: finalError.code, response: null });
        throw finalError;
      } finally {
        active -= 1;
      }
    },
  };
}

export function chunkText(text, maxCharacters = 2000) {
  if (typeof text !== 'string') throw new TypeError('Text to chunk must be a string.');
  if (!Number.isInteger(maxCharacters) || maxCharacters < 2 || maxCharacters > 2000) throw new RangeError('Chunk size must be between 2 and 2000 characters.');
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxCharacters, text.length);
    if (end < text.length && end > start
      && text.charCodeAt(end - 1) >= 0xd800 && text.charCodeAt(end - 1) <= 0xdbff
      && text.charCodeAt(end) >= 0xdc00 && text.charCodeAt(end) <= 0xdfff) end -= 1;
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end - 1);
      if (boundary > start + Math.floor(maxCharacters / 2)) end = boundary + 1;
    }
    chunks.push({ text: text.slice(start, end), start, end });
    start = end;
  }
  return chunks;
}
