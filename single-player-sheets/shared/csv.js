import { blankWorkbook, MAX_BYTES } from "./contracts.js";

export const CSV_LIMITS = { rows: 50000, columns: 1000, cells: 200000 };
const bytes = (value) => new TextEncoder().encode(value).length;
function fail(message) {
  throw new Error(message);
}
function bounds(rows, columns) {
  if (
    rows > CSV_LIMITS.rows ||
    columns > CSV_LIMITS.columns ||
    rows * columns > CSV_LIMITS.cells
  )
    fail(
      "CSV exceeds the limit: 50,000 rows, 1,000 columns, or 200,000 cells in its rectangular data area.",
    );
}
export function detectDelimiter(text) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (c === "\r" || c === "\n") break;
      if (Object.hasOwn(counts, c)) counts[c]++;
    }
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}
export function parseCsv(source, delimiter = "auto") {
  if (typeof source !== "string" || bytes(source) > MAX_BYTES)
    fail("CSV files must be UTF-8 text, at most 5 MiB.");
  const text = source.replace(/^\uFEFF/, "");
  if (!text.length) return [];
  if (delimiter === "auto") delimiter = detectDelimiter(text);
  if (![",", ";", "\t"].includes(delimiter)) fail("Unsupported CSV delimiter.");
  const rows = [];
  let row = [],
    value = "",
    quoted = false,
    closed = false,
    started = false,
    width = 0;
  const field = () => {
    row.push(value);
    value = "";
    closed = false;
    started = false;
    bounds(rows.length + 1, row.length);
  };
  const line = () => {
    field();
    width = Math.max(width, row.length);
    bounds(rows.length + 1, width);
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else value += c;
    } else if (c === delimiter) field();
    else if (c === "\r" || c === "\n") {
      line();
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else if (closed)
      fail(
        "Invalid CSV: only a delimiter or newline may follow a closing quote.",
      );
    else if (c === '"') {
      if (started)
        fail(
          "Invalid CSV: quotes inside a field must be doubled inside a quoted field.",
        );
      quoted = true;
      started = true;
    } else {
      started = true;
      value += c;
    }
  }
  if (quoted) fail("Invalid CSV: a quoted field was not closed.");
  if (started || closed || value.length || row.length) line();
  return rows;
}
function importedCell(value) {
  // Preserve leading zeroes, long identifiers, dates and formula-like strings.
  // Formulas from files are never executed: strings have an explicit type.
  if (
    /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value) &&
    value.replace(/[^0-9]/g, "").length <= 15 &&
    Number.isFinite(Number(value))
  )
    return { v: Number(value), t: 2 };
  return { v: value, t: 1 };
}
export function csvWorkbook(text, name, delimiter = "auto") {
  const rows = parseCsv(text, delimiter);
  if (!rows.length) fail("The selected CSV file is empty.");
  const book = blankWorkbook();
  book.name = name.trim().slice(0, 120) || "Imported spreadsheet";
  const sheet = book.sheets[book.sheetOrder[0]];
  sheet.name = "Imported data";
  sheet.rowCount = Math.max(1000, rows.length);
  sheet.columnCount = Math.max(26, ...rows.map((row) => row.length));
  for (let r = 0; r < rows.length; r++) {
    const cells = {};
    rows[r].forEach((value, c) => {
      if (value !== "") cells[c] = importedCell(value);
    });
    if (Object.keys(cells).length) sheet.cellData[r] = cells;
  }
  return book;
}
function cellValue(cell) {
  if (cell.f && cell.v == null)
    fail(
      "Some formulas have no calculated value yet. Wait for calculation, then export again.",
    );
  if (cell.p?.body?.dataStream != null)
    return cell.p.body.dataStream.replace(/\r\n$/, "");
  if (cell.t === 3 && cell.v != null) return Boolean(cell.v);
  return cell.v ?? "";
}
export function exportCsv(sheet) {
  let height = 0,
    width = 0;
  for (const [r, row] of Object.entries(sheet.cellData || {})) {
    if (!row) continue;
    for (const [c, cell] of Object.entries(row)) {
      if (!cell || (!cell.f && cellValue(cell) === "")) continue;
      height = Math.max(height, Number(r) + 1);
      width = Math.max(width, Number(c) + 1);
    }
  }
  bounds(height, width);
  let size = 3;
  const lines = [];
  for (let r = 0; r < height; r++) {
    const fields = [];
    for (let c = 0; c < width; c++) {
      const value = cellValue(sheet.cellData?.[r]?.[c] || {});
      let text =
        typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : String(value);
      // Quoting alone does not prevent formula injection in external viewers.
      // Keep real numeric values numeric, but neutralize executable-looking text.
      if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@\t\r]/.test(text))
        text = "'" + text;
      fields.push(
        /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text,
      );
    }
    const line = fields.join(",") + "\r\n";
    size += bytes(line);
    if (size > MAX_BYTES)
      fail("Export exceeds the 5 MiB CSV limit. Export a smaller worksheet.");
    lines.push(line);
  }
  return "\uFEFF" + lines.join("");
}
