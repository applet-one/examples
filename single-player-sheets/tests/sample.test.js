import { test } from "node:test";
import assert from "node:assert/strict";
import { studioWorkbook } from "../shared/sample-workbook.js";
import { snapshot } from "../shared/contracts.js";

test("studio sample has four independent sheets, cross-sheet formulas and editable scenario inputs", () => {
  const book = studioWorkbook();
  assert.equal(snapshot(book), book);
  assert.equal(book.name, "Studio operations");
  const sheets = Object.values(book.sheets);
  assert.deepEqual(
    sheets.map((s) => s.name),
    ["Dashboard", "Projects", "Cash flow", "Assumptions"],
  );
  const [dashboard, projects, cash, assumptions] = sheets;
  assert.equal(projects.cellData[4][0].v, "Northstar");
  assert.equal(projects.cellData[18][0].v, "Lumen Energy");
  assert.equal(assumptions.cellData[3][1].v, 125);
  assert.equal(assumptions.cellData[9][1].v, 1);
  assert.equal(assumptions.cellData[10][1].v, 0.6);
  assert.match(projects.cellData[4][5].f, /Assumptions/);
  assert.match(cash.cellData[4][2].f, /SUMIF\(Projects!/);
  assert.match(dashboard.cellData[3][1].f, /'Cash flow'/);
  assert.ok(
    sheets.every((s) => s.mergeData.length >= 2 && s.freeze.ySplit > 0),
  );
  const formulas = sheets
    .flatMap((s) =>
      Object.values(s.cellData).flatMap((row) => Object.values(row)),
    )
    .filter((c) => c.f);
  assert.ok(formulas.length > 150);
  const other = studioWorkbook();
  assert.notEqual(other.id, book.id);
  assert.ok(other.sheetOrder.every((id) => !book.sheetOrder.includes(id)));
});
