import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSensitivityReport, deriveRiskFactors, rankScores, SCORING_EXPERIMENT, scoreAccount } from '../src/scoring.js';

test('risk parameter experiment normalizes factors and scores from available weights only', () => {
  const factors = deriveRiskFactors({
    usage: { relativeChange: -0.5, previousTransactions: 100, coverageRecent: 1, coveragePrevious: 1, evidence: [] },
    service: { openTicketCount: 3, maxOpenTicketAgeDays: 90, evidence: [] },
    champion: { left: true, evidence: [] },
    promiseEngagement: { unmetPromiseCount: 1, daysSinceExternalInteraction: 90, evidence: [] },
    payment: { latePaymentCount: 2, evidence: [] },
  });
  const result = scoreAccount({ accountId: 'A', factors, annualValue: 100_000 });
  assert.equal(factors.usage.normalized, 0.5);
  assert.equal(result.score, 85);
  assert.equal(result.coverage, 100);
  assert.equal(result.level, 'Critical');
  assert.equal(result.weightedValue, 85_000);
});

test('missing/baseline-zero factors stay null and reduce denominator coverage', () => {
  const factors = deriveRiskFactors({
    usage: { relativeChange: null, previousTransactions: 0, coverageRecent: 1, coveragePrevious: 1, evidence: [] },
    service: { openTicketCount: 0, maxOpenTicketAgeDays: 0, evidence: [] },
    champion: { left: null, evidence: [] },
    promiseEngagement: { unmetPromiseCount: null, daysSinceExternalInteraction: 45, evidence: [] },
    payment: { latePaymentCount: 0, evidence: [] },
  });
  assert.equal(factors.usage.normalized, null);
  assert.equal(factors.usage.status, 'unavailable');
  assert.equal(factors.champion.normalized, null);
  assert.equal(factors.promiseEngagement.status, 'partial');
  const result = scoreAccount({ accountId: 'B', factors });
  assert.equal(result.coverage, 42.5);
  assert.equal(result.status, 'partial');
  assert.equal(result.score, 8.82);
  const empty = scoreAccount({ accountId: 'C', factors: { usage: { normalized: null } } });
  assert.equal(empty.score, null);
  assert.equal(empty.status, 'unscored');
});

test('usage loss is clamped while growth does not increase risk', () => {
  const base = { service: { openTicketCount: 0, maxOpenTicketAgeDays: 0, evidence: [] }, champion: { left: false, evidence: [] }, promiseEngagement: { unmetPromiseCount: 0, daysSinceExternalInteraction: 0, evidence: [] }, payment: { latePaymentCount: 0, evidence: [] } };
  const factors = deriveRiskFactors({
    ...base,
    usage: { relativeChange: 0.25, previousTransactions: 100, coverageRecent: 1, coveragePrevious: 1, evidence: [] },
  });
  assert.equal(factors.usage.normalized, 0);
  const loss = deriveRiskFactors({
    ...base,
    usage: { relativeChange: -1.5, previousTransactions: 100, coverageRecent: 1, coveragePrevious: 1, evidence: [] },
  });
  assert.equal(loss.usage.normalized, 1);
});

test('sensitivity shifts every weight by plus/minus ten and preserves total', () => {
  const rows = ['A', 'B', 'C', 'D'].map((accountId, index) => ({
    accountId,
    factors: Object.fromEntries(Object.keys(SCORING_EXPERIMENT.weights).map((key, weightIndex) => [key, {
      normalized: (index + weightIndex) % 4 / 3,
      status: 'available',
      coverage: 1,
    }])),
  }));
  const report = createSensitivityReport(rows);
  assert.equal(report.scenarios.length, 10);
  assert.equal(report.rankChanges.length, 10);
  for (const scenario of report.scenarios) {
    assert.ok(Math.abs(Object.values(scenario.weights).reduce((sum, value) => sum + value, 0) - 100) < 1e-8);
  }
  assert.deepEqual(rankScores(rows).slice(0, 3).map(({ accountId }) => accountId), report.baseTopThree);
});

// Operational levels reuse the former frontend cutoffs, now computed only in the backend.
test('v2 heuristic level boundaries and missing-data policy are deterministic', () => {
  for (const [score,level] of [[0,'Low'],[10.99,'Low'],[11,'Medium'],[14.99,'Medium'],[15,'High'],[29.99,'High'],[30,'Critical'],[100,'Critical']]) {
    const result=scoreAccount({accountId:'fixture',factors:{usage:{normalized:score/100,status:'available',coverage:1}}});
    assert.equal(result.level,level);assert.equal(result.formulaVersion,'risk-heuristic-v2');
  }
  assert.equal(scoreAccount({accountId:'fixture',factors:{}}).level,null);
});
