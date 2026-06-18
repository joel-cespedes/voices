/**
 * Minimal, dependency-free CSV parser supporting quoted fields, escaped quotes
 * ("") and both LF / CRLF line endings. Returns objects keyed by the header row
 * (header names are lower-cased and trimmed).
 *
 * Pure function — no Angular, no I/O — so it can be unit-tested in isolation and
 * reused by any repository adapter.
 */
export type CsvRow = Record<string, string>;

export function parseCsv(input: string): CsvRow[] {
  const records = tokenize(input);
  if (records.length === 0) return [];

  const header = records[0].map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < records.length; i++) {
    const fields = records[i];
    // Skip blank trailing lines.
    if (fields.length === 1 && fields[0] === '') continue;
    const row: CsvRow = {};
    header.forEach((key, col) => {
      row[key] = (fields[col] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

/** Split raw CSV text into an array of records, each an array of fields. */
function tokenize(input: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else if (ch === '\r') {
      // Ignore; the following \n (if any) closes the record.
    } else {
      field += ch;
    }
  }

  // Flush the last field/record if the file does not end with a newline.
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
