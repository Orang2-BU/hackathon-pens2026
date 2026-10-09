import { TextDecoder } from 'node:util';

const MAX_FIELD_LENGTH = 1_000_000;

export async function* parseCsv(source) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '';
  let field = '';
  let row = [];
  let quoted = false;
  let fieldStarted = false;
  let firstCharacter = true;

  for await (const chunk of source) {
    let data = pending + decoder.decode(chunk, { stream: true });
    pending = '';
    let index = 0;
    if (firstCharacter && data.length) {
      firstCharacter = false;
      if (data.charCodeAt(0) === 0xfeff) data = data.slice(1);
    }

    for (; index < data.length; index += 1) {
      const character = data[index];
      if (quoted) {
        if (character === '"') {
          if (index + 1 === data.length) {
            pending = data.slice(index);
            break;
          }
          if (data[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"') {
        if (fieldStarted || field.length > 0) throw new Error('Unexpected quote in unquoted CSV field.');
        quoted = true;
        fieldStarted = true;
      } else if (character === ',') {
        row.push(field);
        field = '';
        fieldStarted = false;
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && index + 1 === data.length) {
          pending = data.slice(index);
          break;
        }
        if (character === '\r' && data[index + 1] === '\n') index += 1;
        row.push(field);
        yield row;
        row = [];
        field = '';
        fieldStarted = false;
      } else {
        if (fieldStarted && field === '') throw new Error('Unexpected character after closing CSV quote.');
        field += character;
        if (field.length > MAX_FIELD_LENGTH) throw new Error('CSV field exceeds the maximum supported length.');
      }
      if (field.length > MAX_FIELD_LENGTH) throw new Error('CSV field exceeds the maximum supported length.');
    }
  }

  pending += decoder.decode();
  for (let index = 0; index < pending.length; index += 1) {
    const character = pending[index];
    if (quoted) {
      if (character === '"') {
        if (pending[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && pending[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.length > 1 || row[0] !== '') yield row;
      row = [];
      field = '';
      fieldStarted = false;
    } else if (character === ',') {
      row.push(field);
      field = '';
      fieldStarted = false;
    } else if (character === '"') {
      if (fieldStarted || field.length > 0) throw new Error('Unexpected quote in unquoted CSV field.');
      quoted = true;
      fieldStarted = true;
    } else {
      if (fieldStarted && field === '') throw new Error('Unexpected character after closing CSV quote.');
      field += character;
    }
  }

  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field.length > MAX_FIELD_LENGTH) throw new Error('CSV field exceeds the maximum supported length.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    yield row;
  }
}

export function validateHeader(header, expected, fileName) {
  if (header.some((name) => !name) || new Set(header).size !== header.length) {
    throw new Error(`${fileName}: header contains an empty or duplicate column.`);
  }
  if (header.length !== expected.length || header.some((name, index) => name !== expected[index])) {
    throw new Error(`${fileName}: header does not match the expected dataset schema.`);
  }
}
