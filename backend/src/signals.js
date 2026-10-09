import { createHash } from 'node:crypto';

export const SIGNAL_THRESHOLDS = Object.freeze({
  noulWrite: 0.85,
  noulReview: 0.5,
  scoreConfidenceWrite: 0.8,
  scoreWrite: 2,
});

export function classifySignal(answer) {
  if (!answer || typeof answer !== 'object') throw new TypeError('A validated Jev answer is required.');
  if (answer.type === 'noul') {
    if (!Number.isFinite(answer.noul) || answer.noul < 0 || answer.noul > 1) throw new RangeError('Noul probability must be in [0, 1].');
    if (answer.noul >= SIGNAL_THRESHOLDS.noulWrite) return 'active';
    if (answer.noul >= SIGNAL_THRESHOLDS.noulReview) return 'review';
    return 'discarded';
  }
  if (answer.type === 'score') {
    if (!Number.isFinite(answer.score) || answer.score < 0 || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) {
      throw new RangeError('Score and confidence must be finite and non-negative.');
    }
    if (answer.confidence < SIGNAL_THRESHOLDS.scoreConfidenceWrite) return 'review';
    return answer.score >= SIGNAL_THRESHOLDS.scoreWrite ? 'active' : 'discarded';
  }
  if (answer.type === 'choice') {
    if (typeof answer.choice !== 'string' || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) {
      throw new RangeError('Choice and confidence are invalid.');
    }
    if (answer.confidence < SIGNAL_THRESHOLDS.scoreConfidenceWrite) return 'review';
    return answer.choice === 'negative' ? 'active' : 'discarded';
  }
  throw new TypeError('Only validated Jev noul, score and choice outputs can create signals.');
}

export function buildSignalCandidate({ sourceText, chunk, sourceRecordId, sourceHash, label, answer, jevRunId, model, rubricVersion }) {
  if (typeof sourceText !== 'string' || !chunk || typeof chunk.text !== 'string'
    || !Number.isInteger(chunk.start) || !Number.isInteger(chunk.end)
    || chunk.start < 0 || chunk.end <= chunk.start
    || sourceText.slice(chunk.start, chunk.end) !== chunk.text) {
    throw new Error('Jev chunk does not match its exact source-text span.');
  }
  if (!/^[0-9a-f]{64}$/u.test(sourceHash) || !sourceRecordId || !label || !jevRunId || !model || !rubricVersion) {
    throw new Error('Signal provenance is incomplete.');
  }
  const status = classifySignal(answer);
  const inputHash = createHash('sha256').update(`${sourceHash}\0${label}\0${rubricVersion}\0${chunk.start}\0${chunk.end}`).digest('hex');
  return {
    id: createHash('sha256').update(`${inputHash}\0${model}`).digest('hex'),
    inputHash,
    label,
    status,
    jevRunId,
    model,
    rubricVersion,
    sourceRecordId,
    sourceHash,
    quote: chunk.text,
    spanStart: chunk.start,
    spanEnd: chunk.end,
    answer,
  };
}

export function classifyEntityMatch(probability, hasHardIdentifierConflict) {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new RangeError('Entity match probability must be in [0, 1].');
  if (typeof hasHardIdentifierConflict !== 'boolean') throw new TypeError('Hard identifier conflict status is required.');
  if (hasHardIdentifierConflict) return 'blocked';
  if (probability >= 0.95) return 'merge';
  if (probability >= 0.6) return 'review';
  return 'separate';
}
