import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const fixtures = new URL('../fixtures/', import.meta.url);
const intentFixture = JSON.parse(await readFile(new URL('intent-cases-v1.json', fixtures), 'utf8'));
const integrityFixture = JSON.parse(await readFile(new URL('integrity-cases-v1.json', fixtures), 'utf8'));

test('intent eval fixture has 30 unique, labeled cases across all declared intents', () => {
  const ids = intentFixture.cases.map(({ id }) => id);
  assert.equal(intentFixture.cases.length, 30);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(new Set(intentFixture.cases.map(({ expectedIntent }) => expectedIntent)), new Set(intentFixture.intents));
  for (const intent of intentFixture.intents) {
    assert.equal(intentFixture.cases.filter((item) => item.expectedIntent === intent).length, 3);
  }
  assert.equal(intentFixture.labelStatus, 'draft-needs-team-review');
  assert.match(intentFixture.reviewer, /team confirmation pending/);
});

test('integrity fixture covers parser, missing data, temporal, entity, and quote boundaries', () => {
  const ids = integrityFixture.cases.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(new Set(integrityFixture.cases.map(({ kind }) => kind)), new Set([
    'duplicate_primary_id',
    'orphan_account_reference',
    'missing_numeric_baseline',
    'business_snapshot_exclusive_end',
    'conflicting_hard_identifiers',
    'negated_migration_intent',
    'exact_quote_span_utf16',
    'historical_state_not_current',
  ]));
  const quote = integrityFixture.cases.find(({ kind }) => kind === 'exact_quote_span_utf16');
  assert.equal(quote.input.text.slice(quote.expectedStart, quote.expectedEnd), quote.quote);
  assert.equal(intentFixture.cases.some((item) => 'expectedAnswer' in item), false);
});
