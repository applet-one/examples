import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCsv,
  csvWorkbook,
  exportCsv,
  detectDelimiter,
} from "../shared/csv.js";
import { MAX_BYTES } from "../shared/contracts.js";

test("CSV parser handles BOM, quoted delimiters, escaped quotes, line endings and trailing fields", () => {
  assert.deepEqual(
    parseCsv(
      '\uFEFFName,Description,Value\r\n"Müller, Ada","He said ""hello""\r\nnext line",12.5\r\nlast,,\r\n',
    ),
    [
      ["Name", "Description", "Value"],
      ["Müller, Ada", 'He said "hello"\r\nnext line', "12.5"],
      ["last", "", ""],
    ],
  );
  assert.deepEqual(parseCsv("a,b\rc,d\ne,f"), [
    ["a", "b"],
    ["c", "d"],
    ["e", "f"],
  ]);
  assert.deepEqual(parseCsv('""'), [[""]]);
  assert.deepEqual(parseCsv(""), []);
  assert.deepEqual(parseCsv("a,b,"), [["a", "b", ""]]);
  assert.deepEqual(parseCsv("a,b\n\n"), [["a", "b"], [""]]);
});
test("delimiters are detected outside quotes and can be overridden", () => {
  assert.equal(detectDelimiter('"a,b";c\n1;2'), ";");
  assert.deepEqual(parseCsv("a\tb\n1\t2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
  assert.deepEqual(parseCsv("a;b\n1;2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
  assert.deepEqual(parseCsv('"a,b";c', ";"), [["a,b", "c"]]);
  assert.deepEqual(parseCsv("a;b", ","), [["a;b"]]);
});
test("malformed or oversized CSV fails with actionable errors", () => {
  for (const value of ['"unclosed', 'a"b,c', '"closed"x,2'])
    assert.throws(() => parseCsv(value), /Invalid CSV/);
  assert.throws(() => parseCsv("x", "|"), /delimiter/);
  assert.throws(() => parseCsv("x".repeat(MAX_BYTES + 1)), /5 MiB/);
  assert.throws(() => parseCsv(Array(1001).fill("x").join(",")), /limit/);
  assert.throws(() => parseCsv("1,2,3,4,5\n".repeat(40001)), /limit/);
  assert.throws(() => csvWorkbook("", "Empty"), /empty/);
});
test("import uses safe native typed cells and preserves identifiers, dates and formula text", () => {
  const book = csvWorkbook(
    "123,-12.5,00123,1234567890123456,2026-01-01,=SUM(A1:B1),+1,@SUM(A1),-cmd,TRUE",
    "example",
  );
  const cells = book.sheets[book.sheetOrder[0]].cellData[0];
  assert.deepEqual(cells[0], { v: 123, t: 2 });
  assert.deepEqual(cells[1], { v: -12.5, t: 2 });
  for (const c of [2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(cells[c].t, 1);
    assert.equal(cells[c].f, undefined);
  }
  assert.equal(cells[2].v, "00123");
  assert.equal(cells[3].v, "1234567890123456");
  assert.equal(cells[5].v, "=SUM(A1:B1)");
  assert.equal(book.name, "example");
});
test("export uses rectangular raw values, current formula results, booleans and rich text", () => {
  const sheet = {
    cellData: {
      0: { 0: { v: "Name" }, 1: { v: "Value" } },
      1: {
        0: { v: 'Müller, "Ada"\nLine 2' },
        1: { v: 1250.5, s: { n: { pattern: "$0.00" } } },
      },
      2: { 1: { f: "=B2*2", v: 2501 } },
      3: {
        0: { t: 3, v: 1 },
        1: { p: { body: { dataStream: "Rich text\r\n" } } },
      },
      50: { 50: { s: { bl: 1 } } },
    },
  };
  const result = exportCsv(sheet);
  assert.ok(result.startsWith("\uFEFF"));
  assert.ok(result.endsWith("\r\n"));
  assert.deepEqual(parseCsv(result), [
    ["Name", "Value"],
    ['Müller, "Ada"\nLine 2', "1250.5"],
    ["", "2501"],
    ["TRUE", "Rich text"],
  ]);
});
test("export neutralizes formula-like strings, not actual numeric values", () => {
  const row = [
    "=1+1",
    "+CMD",
    "-CMD",
    "@SUM(A1)",
    "  =2+2",
    "\tCMD",
    "normal",
  ].map((v) => ({ v, t: 1 }));
  row.push({ v: -12.5, t: 2 });
  const values = parseCsv(exportCsv({ cellData: { 0: row } }))[0];
  assert.deepEqual(values, [
    "'=1+1",
    "'+CMD",
    "'-CMD",
    "'@SUM(A1)",
    "'  =2+2",
    "'\tCMD",
    "normal",
    "-12.5",
  ]);
});
test("empty, uncalculated and excessive export regions are handled explicitly", () => {
  assert.equal(exportCsv({ cellData: {} }), "\uFEFF");
  assert.throws(
    () => exportCsv({ cellData: { 0: { 0: { f: "=1+1" } } } }),
    /calculated/,
  );
  assert.throws(
    () =>
      exportCsv({ cellData: { 49999: { 999: { v: "Sparse distant cell" } } } }),
    /limit/,
  );
  assert.throws(
    () => exportCsv({ cellData: { 0: { 0: { v: "x".repeat(MAX_BYTES) } } } }),
    /5 MiB/,
  );
});
