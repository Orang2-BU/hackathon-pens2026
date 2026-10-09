export const SCORING_EXPERIMENT = Object.freeze({
  formulaVersion: 'risk-heuristic-v1',
  businessAsOf: '2026-10-01',
  weights: Object.freeze({ usage: 30, service: 25, champion: 20, promiseEngagement: 15, payment: 10 }),
  usageMinimumCoverage: 0.9,
  serviceCountSaturation: 3,
  serviceAgeSaturationDays: 90,
  paymentLateCountSaturation: 2,
  sensitivityShift: 10,
});

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function boundedRisk(value) {
  return Math.min(1, Math.max(0, value));
}

function measured(normalized, raw, evidence, status = 'available', reason = null, coverage = null) {
  if (status === 'unavailable' || status === 'excluded' || !finite(normalized)) {
    return { normalized: null, raw, status, reason: reason ?? 'Required data is unavailable.', coverage, evidence };
  }
  if (normalized < 0 || normalized > 1) throw new RangeError('Normalized factor must be in [0, 1].');
  return { normalized, raw, status, reason, coverage, evidence };
}

export function deriveRiskFactors(metrics, config = SCORING_EXPERIMENT) {
  const usageCoverage = Math.min(metrics.usage?.coverageRecent ?? 0, metrics.usage?.coveragePrevious ?? 0);
  let usage;
  if (!metrics.usage || !finite(metrics.usage.relativeChange) || metrics.usage.previousTransactions <= 0) {
    usage = measured(null, metrics.usage ?? null, metrics.usage?.evidence ?? [], 'unavailable', metrics.usage?.reason ?? 'A positive previous-period baseline is required.', usageCoverage);
  } else if (usageCoverage < config.usageMinimumCoverage) {
    usage = measured(null, metrics.usage, metrics.usage.evidence, 'unavailable', `Usage coverage is below ${config.usageMinimumCoverage}.`, usageCoverage);
  } else {
    usage = measured(boundedRisk(-metrics.usage.relativeChange), metrics.usage, metrics.usage.evidence,
      usageCoverage < 1 ? 'partial' : 'available', usageCoverage < 1 ? 'Some outlet-days are missing.' : null, usageCoverage);
  }

  const service = metrics.service
    ? measured(boundedRisk(0.7 * (metrics.service.openTicketCount / config.serviceCountSaturation)
      + 0.3 * (metrics.service.maxOpenTicketAgeDays / config.serviceAgeSaturationDays)), metrics.service,
      metrics.service.evidence, 'available', null, 1)
    : measured(null, null, [], 'unavailable', 'Support snapshot is unavailable.');

  const champion = metrics.champion?.left === null || metrics.champion?.left === undefined
    ? measured(null, metrics.champion ?? null, metrics.champion?.evidence ?? [], 'unavailable', 'Current champion employment is unknown.')
    : measured(metrics.champion.left ? 1 : 0, metrics.champion, metrics.champion.evidence, 'available', null, 1);

  const engagementParts = [];
  if (finite(metrics.promiseEngagement?.unmetPromiseCount)) {
    engagementParts.push(boundedRisk(metrics.promiseEngagement.unmetPromiseCount));
  }
  if (finite(metrics.promiseEngagement?.daysSinceExternalInteraction)) {
    engagementParts.push(boundedRisk(metrics.promiseEngagement.daysSinceExternalInteraction / 90));
  }
  const promiseEngagement = engagementParts.length
    ? measured(engagementParts.reduce((sum, value) => sum + value, 0) / engagementParts.length,
      metrics.promiseEngagement, metrics.promiseEngagement.evidence,
      engagementParts.length < 2 ? 'partial' : 'available', engagementParts.length < 2 ? 'Only part of promise/engagement data is measurable.' : null,
      engagementParts.length / 2)
    : measured(null, metrics.promiseEngagement ?? null, metrics.promiseEngagement?.evidence ?? [], 'unavailable', 'Promise and external engagement data are unavailable.');

  const payment = finite(metrics.payment?.latePaymentCount)
    ? measured(boundedRisk(metrics.payment.latePaymentCount / config.paymentLateCountSaturation), metrics.payment, metrics.payment.evidence, 'available', null, 1)
    : measured(null, metrics.payment ?? null, metrics.payment?.evidence ?? [], 'unavailable', 'Payment delay count is unavailable.');

  return { usage, service, champion, promiseEngagement, payment };
}

function normalizeWeights(weights) {
  const entries = Object.entries(weights);
  if (!entries.length || entries.some(([, value]) => !finite(value) || value < 0) || entries.every(([, value]) => value === 0)) throw new TypeError('Scoring weights must be non-negative finite numbers with at least one positive weight.');
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (Math.abs(total - 100) > 1e-8) throw new RangeError('Scoring weights must total 100.');
  return weights;
}

export function scoreAccount({ accountId, factors, annualValue = null, formulaVersion = SCORING_EXPERIMENT.formulaVersion, weights = SCORING_EXPERIMENT.weights }) {
  if (!accountId || !factors || typeof factors !== 'object') throw new TypeError('Account ID and factor map are required.');
  normalizeWeights(weights);
  const available = Object.entries(weights).flatMap(([name, weight]) => {
    const factor = factors[name];
    if (factor?.normalized === null || !finite(factor?.normalized)) return [];
    const factorCoverage = factor.status === 'partial' && finite(factor.coverage) ? boundedRisk(factor.coverage) : 1;
    return [{ name, effectiveWeight: weight * factorCoverage }];
  });
  const availableWeight = available.reduce((sum, factor) => sum + factor.effectiveWeight, 0);
  const weightedTotal = available.reduce((sum, factor) => sum + factor.effectiveWeight * factors[factor.name].normalized, 0);
  const score = availableWeight ? Math.round((weightedTotal / availableWeight) * 10000) / 100 : null;
  const coverage = Math.round(availableWeight * 100) / 100;
  return {
    accountId,
    formulaVersion,
    score,
    status: score === null ? 'unscored' : coverage === 100 ? 'complete' : 'partial',
    coverage,
    level: null,
    levelReason: 'Priority level cutoffs have not been approved.',
    factors,
    annualValue,
    weightedValue: score === null || !finite(annualValue) ? null : Math.round((annualValue * score / 100) * 100) / 100,
  };
}

export function createSensitivityReport(scores, weights = SCORING_EXPERIMENT.weights, shift = SCORING_EXPERIMENT.sensitivityShift) {
  normalizeWeights(weights);
  if (!Number.isInteger(shift) || shift <= 0 || shift > Math.min(...Object.values(weights))) throw new RangeError('Sensitivity shift must be positive and no larger than the smallest weight.');
  const baseRanking = rankScores(scores);
  const scenarios = [];
  for (const factor of Object.keys(weights)) {
    for (const delta of [-shift, shift]) {
      const changed = { ...weights, [factor]: weights[factor] + delta };
      const otherFactors = Object.keys(weights).filter((name) => name !== factor);
      const otherTotal = otherFactors.reduce((sum, name) => sum + weights[name], 0);
      const targetOtherTotal = 100 - changed[factor];
      for (const name of otherFactors) changed[name] = Math.round((weights[name] * targetOtherTotal / otherTotal) * 10000) / 10000;
      const roundingDifference = 100 - Object.values(changed).reduce((sum, value) => sum + value, 0);
      changed[otherFactors[0]] += roundingDifference;
      const ranking = rankScores(scores.map((row) => scoreAccount({ accountId: row.accountId, factors: row.factors, annualValue: row.annualValue, weights: changed })));
      scenarios.push({ factor, delta, weights: changed, topThree: ranking.slice(0, 3).map(({ accountId }) => accountId) });
    }
  }
  const baseTopThree = baseRanking.slice(0, 3).map(({ accountId }) => accountId);
  return {
    shift,
    baseTopThree,
    scenarios,
    rankChanges: scenarios.map((scenario) => ({
      factor: scenario.factor,
      delta: scenario.delta,
      topThreeChanged: scenario.topThree.join(',') !== baseTopThree.join(','),
      topThree: scenario.topThree,
    })),
  };
}

export function rankScores(scores) {
  return [...scores].sort((left, right) => {
    if (left.score === null) return right.score === null ? left.accountId.localeCompare(right.accountId) : 1;
    if (right.score === null) return -1;
    return right.score - left.score || left.accountId.localeCompare(right.accountId);
  });
}
