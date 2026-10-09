import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { parseCsv, validateHeader } from '../src/csv.js';

async function parse(chunks) {
  const records = [];
  for await (const row of parseCsv(Readable.from(chunks))) records.push(row);
  return records;
}

test('CSV parser handles BOM, CRLF, commas, quotes, and quoted newlines across chunks', async () => {
  const input = Buffer.from('\uFEFFid,text\r\n1,"first, line\r\nsecond ""quoted"" line"\r\n2,café');
  const records = await parse([...Array.from({ length: input.length }, (_, index) => input.subarray(index, index + 1))]);
  assert.deepEqual(records, [
    ['id', 'text'],
    ['1', 'first, line\r\nsecond "quoted" line'],
    ['2', 'café'],
  ]);
});

test('CSV parser rejects malformed quotes and invalid UTF-8', async () => {
  await assert.rejects(parse([Buffer.from('id,text\n1,"open')]), /Unterminated quoted CSV field/);
  await assert.rejects(parse([Buffer.from([0x69, 0x64, 0x2c, 0xff])]), /encoded data/);
});

test('header validation rejects duplicate and unexpected columns', () => {
  assert.throws(() => validateHeader(['id', 'id'], ['id', 'text'], 'test.csv'), /empty or duplicate/);
  assert.throws(() => validateHeader(['id', 'other'], ['id', 'text'], 'test.csv'), /expected dataset schema/);
});
