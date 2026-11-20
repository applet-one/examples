export const MAX_BYTES = 5 * 1024 * 1024;
export const SCHEMA_VERSION = 1;
export const UNIVER_VERSION = "1.5.2";
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function check(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
export function title(value) {
  check(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim().length <= 120,
    "Title must contain 1–120 characters.",
  );
  return value.trim();
}
export function snapshot(value, id) {
  check(
    value && typeof value === "object" && !Array.isArray(value),
    "A native workbook snapshot is required.",
  );
  check(
    typeof value.id === "string" && (!id || value.id === id),
    "Workbook identity does not match.",
  );
  check(
    Array.isArray(value.sheetOrder) &&
      value.sheetOrder.length > 0 &&
      value.sheetOrder.length <= 100,
    "A workbook must contain 1–100 worksheets.",
  );
  check(
    value.sheets && typeof value.sheets === "object",
    "Worksheet data is required.",
  );
  check(
    new Set(value.sheetOrder).size === value.sheetOrder.length,
    "Duplicate worksheet identities.",
  );
  for (const key of value.sheetOrder) {
    const sheet = value.sheets[key];
    check(
      typeof key === "string" &&
        Object.hasOwn(value.sheets, key) &&
        sheet &&
        sheet.id === key,
      "Invalid worksheet identity.",
    );
    check(
      Number.isSafeInteger(sheet.rowCount) &&
        sheet.rowCount > 0 &&
        sheet.rowCount <= 1000000 &&
        Number.isSafeInteger(sheet.columnCount) &&
        sheet.columnCount > 0 &&
        sheet.columnCount <= 16384,
      "Invalid worksheet dimensions.",
    );
  }
  check(
    new TextEncoder().encode(JSON.stringify(value)).length <= MAX_BYTES,
    "Workbook exceeds the 5 MiB limit. Your local recovery copy is retained.",
    413,
  );
  return value;
}
export function saveInput(value, id) {
  check(
    value && value.schemaVersion === SCHEMA_VERSION,
    "Unsupported application snapshot version.",
  );
  check(
    value.univerVersion === UNIVER_VERSION,
    "Unsupported Univer version. Reload the application.",
  );
  check(
    Number.isSafeInteger(value.baseRevision) && value.baseRevision >= 1,
    "Invalid base revision.",
  );
  check(
    typeof value.mutationId === "string" &&
      /^[a-zA-Z0-9-]{16,80}$/.test(value.mutationId),
    "Invalid save mutation ID.",
  );
  snapshot(value.snapshot, id);
  return value;
}
export function blankWorkbook() {
  const id = crypto.randomUUID(),
    sheetId = crypto.randomUUID();
  return {
    id,
    name: "Untitled spreadsheet",
    appVersion: UNIVER_VERSION,
    locale: "enUS",
    styles: {},
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: "Sheet1",
        rowCount: 1000,
        columnCount: 26,
        cellData: {},
      },
    },
  };
}
