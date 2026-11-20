import { blankWorkbook } from "./contracts.js";

// Native OSS Univer model only: inputs are warm yellow; formulas are neutral.
// No runtime services, calculated caches, or external data sources are needed.
export function studioWorkbook() {
  const book = blankWorkbook();
  book.name = "Studio operations";
  book.sheetOrder = [];
  book.sheets = {};
  const color = (value) => ({ rgb: value });
  const styles = {
    title: { bg: color("#246b50"), cl: color("#ffffff"), bl: 1, fs: 20 },
    subtitle: { cl: color("#61766a"), fs: 11 },
    header: { bg: color("#e1eee6"), cl: color("#254c3b"), bl: 1 },
    label: { cl: color("#365747"), bl: 1 },
    input: { bg: color("#fff4d6"), cl: color("#755014") },
    money: { n: { pattern: "$#,##0;[Red]($#,##0)" } },
    percent: { n: { pattern: "0.0%" } },
    decimal: { n: { pattern: "0.0" } },
    integer: { n: { pattern: "0" } },
    multiplier: { n: { pattern: '0.00"x"' } },
  };
  function sheet(name, widths) {
    const id = crypto.randomUUID();
    const model = {
      id,
      name,
      rowCount: 200,
      columnCount: Math.max(16, widths.length),
      cellData: {},
      columnData: {},
      rowData: { 0: { h: 42 }, 1: { h: 28 } },
      mergeData: [],
      defaultRowHeight: 26,
      freeze: { xSplit: 0, ySplit: 4, startRow: 4, startColumn: -1 },
      tabColor: "#246b50",
    };
    widths.forEach((w, i) => (model.columnData[i] = { w }));
    book.sheetOrder.push(id);
    book.sheets[id] = model;
    return model;
  }
  function cell(sheet, row, col, value, ...styleNames) {
    (sheet.cellData[row - 1] ||= {})[col - 1] = {
      ...(typeof value === "string" && value.startsWith("=")
        ? { f: value }
        : { v: value }),
      s: Object.assign({}, ...styleNames.map((name) => styles[name])),
    };
  }
  function row(sheet, index, values, style) {
    values.forEach((v, i) => cell(sheet, index, i + 1, v, style));
  }
  function banner(sheet, title, description, columns) {
    cell(sheet, 1, 1, title, "title");
    cell(sheet, 2, 1, description, "subtitle");
    for (const r of [0, 1])
      sheet.mergeData.push({
        startRow: r,
        endRow: r,
        startColumn: 0,
        endColumn: columns - 1,
      });
  }
  const dashboard = sheet(
    "Dashboard",
    [185, 145, 140, 150, 145, 140, 145, 145, 100],
  );
  const projects = sheet(
    "Projects",
    [165, 220, 110, 115, 95, 110, 135, 145, 120, 140, 135, 110],
  );
  const cash = sheet(
    "Cash flow",
    [120, 140, 140, 150, 140, 140, 140, 150, 140],
  );
  const assumptions = sheet("Assumptions", [235, 150, 430]);
  banner(
    assumptions,
    "Planning assumptions",
    "Edit the yellow cells. The project portfolio, cash forecast, and dashboard recalculate together.",
    3,
  );
  row(assumptions, 3, ["Driver", "Value", "How it is used"], "header");
  const drivers = [
    [
      "Standard hourly rate",
      125,
      "Default rate for projects without a negotiated rate.",
      "money",
    ],
    [
      "Internal delivery cost / hour",
      45,
      "Applied to every project hour, in addition to external costs.",
      "money",
    ],
    [
      "Opening cash balance",
      35000,
      "Cash available at the beginning of January.",
      "money",
    ],
    [
      "Monthly operating overhead",
      9500,
      "Rent, salaries outside delivery, subscriptions, and admin.",
      "money",
    ],
    [
      "Monthly revenue target",
      30000,
      "Used by the dashboard to compare the forecast with plan.",
      "money",
    ],
    [
      "Tax reserve on positive profit",
      0.22,
      "Reserved monthly only when operating profit is positive.",
      "percent",
    ],
    [
      "Revenue scenario multiplier",
      1,
      "Try 0.8 for a downside case or 1.2 for an upside case.",
      "multiplier",
    ],
    [
      "Pipeline probability",
      0.6,
      "Pipeline revenue is probability-weighted; project costs remain conservative.",
      "percent",
    ],
  ];
  drivers.forEach(([label, value, explanation, format], i) => {
    cell(assumptions, i + 4, 1, label, "label");
    cell(assumptions, i + 4, 2, value, "input", format);
    cell(assumptions, i + 4, 3, explanation, "subtitle");
  });
  row(assumptions, 14, ["Model notes", "", ""], "header");
  const notes = [
    "All figures are fictional USD amounts; this is a planning example, not accounting advice.",
    "Invoice month is also the assumed payment month. No receivables lag or sales tax is modeled.",
    "Delivered and Booked projects count at full value; Pipeline projects use the probability above.",
    "The revenue scenario changes receipts, not delivery cost. Costs therefore stay conservative.",
    "Yellow cells are inputs, not protected cells. Undo/redo is available throughout the workbook.",
    "Try changing the hourly rate, pipeline probability, or overhead, then revisit Dashboard.",
  ];
  notes.forEach((text, i) => {
    cell(assumptions, i + 15, 1, text, "subtitle");
    assumptions.mergeData.push({
      startRow: i + 14,
      endRow: i + 14,
      startColumn: 0,
      endColumn: 2,
    });
  });

  banner(
    projects,
    "Project profitability",
    "15 engagements · editable inputs in yellow · rates, costs, profit, and margin linked to Assumptions",
    12,
  );
  row(
    projects,
    4,
    [
      "Client",
      "Engagement",
      "Status",
      "Invoice month",
      "Hours",
      "Hourly rate",
      "Revenue",
      "External delivery",
      "Other costs",
      "Total cost",
      "Profit",
      "Margin",
    ],
    "header",
  );
  const portfolio = [
    ["Northstar", "Brand strategy", "Delivered", "Jan", 120, null, 1800, 300],
    ["Cedar Labs", "Website discovery", "Delivered", "Jan", 80, null, 600, 150],
    [
      "Atlas Health",
      "Product research",
      "Delivered",
      "Feb",
      160,
      150,
      3200,
      400,
    ],
    ["Moss & Co", "Identity refresh", "Delivered", "Feb", 100, null, 1200, 200],
    ["Northstar", "Website build", "Booked", "Mar", 240, null, 4500, 750],
    ["Fieldwork", "Launch campaign", "Booked", "Mar", 140, null, 2200, 900],
    ["Cedar Labs", "Design system", "Booked", "Apr", 200, 140, 2800, 300],
    ["Atlas Health", "Patient portal", "Booked", "Apr", 180, 150, 3600, 450],
    ["Juniper", "Service blueprint", "Pipeline", "Apr", 110, null, 900, 250],
    ["Moss & Co", "E-commerce rollout", "Booked", "May", 220, null, 4000, 600],
    ["Fieldwork", "Analytics review", "Pipeline", "May", 90, 140, 800, 100],
    [
      "Lumen Energy",
      "Customer research",
      "Pipeline",
      "May",
      150,
      150,
      2400,
      500,
    ],
    ["Northstar", "Quarterly retainer", "Booked", "Jun", 160, null, 1200, 200],
    ["Juniper", "Implementation", "Pipeline", "Jun", 200, null, 3000, 450],
    [
      "Lumen Energy",
      "Experience prototype",
      "Pipeline",
      "Jun",
      180,
      150,
      2700,
      300,
    ],
  ];
  portfolio.forEach(
    ([client, project, status, month, hours, rate, external, other], i) => {
      const r = i + 5;
      [client, project, status, month, hours].forEach((value, c) =>
        cell(projects, r, c + 1, value, "input"),
      );
      cell(
        projects,
        r,
        6,
        rate ?? "=Assumptions!$B$4",
        ...(rate ? ["input", "money"] : ["money"]),
      );
      cell(
        projects,
        r,
        7,
        `=E${r}*F${r}*IF(C${r}="Pipeline",Assumptions!$B$11,1)`,
        "money",
      );
      cell(projects, r, 8, external, "input", "money");
      cell(projects, r, 9, other, "input", "money");
      cell(projects, r, 10, `=E${r}*Assumptions!$B$5+H${r}+I${r}`, "money");
      cell(projects, r, 11, `=G${r}-J${r}`, "money");
      cell(projects, r, 12, `=IFERROR(K${r}/G${r},0)`, "percent");
    },
  );
  cell(projects, 21, 1, "PORTFOLIO TOTAL", "header");
  for (const c of [5, 7, 8, 9, 10, 11])
    cell(
      projects,
      21,
      c,
      `=SUM(${String.fromCharCode(64 + c)}5:${String.fromCharCode(64 + c)}19)`,
      "header",
      ...(c === 5 ? [] : ["money"]),
    );
  cell(projects, 21, 12, "=IFERROR(K21/G21,0)", "header", "percent");

  banner(
    cash,
    "Six-month cash-flow forecast",
    "Probability-weighted receipts, conservative delivery costs, operating overhead, and a tax reserve.",
    9,
  );
  row(
    cash,
    4,
    [
      "Month",
      "Opening cash",
      "Receipts",
      "Delivery cost",
      "Overhead",
      "Tax reserve",
      "Net cash flow",
      "Closing cash",
      "Runway / months",
    ],
    "header",
  );
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].forEach((month, i) => {
    const r = i + 5;
    cell(cash, r, 1, month, "label");
    cell(cash, r, 2, i ? `=H${r - 1}` : "=Assumptions!$B$6", "money");
    cell(
      cash,
      r,
      3,
      `=SUMIF(Projects!$D$5:$D$19,A${r},Projects!$G$5:$G$19)*Assumptions!$B$10`,
      "money",
    );
    cell(
      cash,
      r,
      4,
      `=SUMIF(Projects!$D$5:$D$19,A${r},Projects!$J$5:$J$19)`,
      "money",
    );
    cell(cash, r, 5, "=Assumptions!$B$7", "money");
    cell(cash, r, 6, `=MAX(0,C${r}-D${r}-E${r})*Assumptions!$B$9`, "money");
    cell(cash, r, 7, `=C${r}-D${r}-E${r}-F${r}`, "money");
    cell(cash, r, 8, `=B${r}+G${r}`, "money");
    cell(cash, r, 9, `=IFERROR(H${r}/E${r},0)`, "decimal");
  });
  cell(cash, 12, 1, "SIX-MONTH TOTAL", "header");
  for (const [c, letter] of [
    [3, "C"],
    [4, "D"],
    [5, "E"],
    [6, "F"],
    [7, "G"],
  ])
    cell(cash, 12, c, `=SUM(${letter}5:${letter}10)`, "header", "money");

  banner(
    dashboard,
    "Studio operations | H1 plan",
    "A fictional independent studio · explore Projects, Cash flow, and Assumptions using the sheet tabs below.",
    9,
  );
  const metrics = [
    [4, 1, "Revenue forecast", 2, "=SUM('Cash flow'!C5:C10)", "money"],
    [4, 4, "Project profit", 5, "=Projects!K21", "money"],
    [4, 7, "Closing cash", 8, "='Cash flow'!H10", "money"],
    [
      5,
      1,
      "Portfolio margin",
      2,
      "=IFERROR(Projects!K21/Projects!G21,0)",
      "percent",
    ],
    [5, 4, "Engagements", 5, "=COUNTA(Projects!B5:B19)", "integer"],
    [5, 7, "Cash runway", 8, "='Cash flow'!I10", "decimal"],
    [
      6,
      1,
      "Revenue vs target",
      2,
      "=IFERROR(B4/(Assumptions!B8*6),0)",
      "percent",
    ],
  ];
  metrics.forEach(([r, labelCol, label, valueCol, formula, format]) => {
    cell(dashboard, r, labelCol, label, "label");
    cell(dashboard, r, valueCol, formula, format);
  });
  row(
    dashboard,
    8,
    [
      "Month",
      "Receipts",
      "Delivery cost",
      "Overhead",
      "Tax reserve",
      "Net cash",
      "Closing cash",
      "Cash health",
    ],
    "header",
  );
  for (let i = 0; i < 6; i++) {
    const r = i + 9,
      source = i + 5;
    cell(dashboard, r, 1, `='Cash flow'!A${source}`, "label");
    for (const [c, letter] of [
      [2, "C"],
      [3, "D"],
      [4, "E"],
      [5, "F"],
      [6, "G"],
      [7, "H"],
    ])
      cell(dashboard, r, c, `='Cash flow'!${letter}${source}`, "money");
    cell(dashboard, r, 8, `=IF(G${r}<20000,"Review","Healthy")`);
  }
  row(
    dashboard,
    18,
    ["Portfolio status", "Projects", "Revenue", "Project profit"],
    "header",
  );
  ["Delivered", "Booked", "Pipeline"].forEach((status, i) => {
    const r = i + 19;
    cell(dashboard, r, 1, status, "label");
    cell(dashboard, r, 2, `=COUNTIF(Projects!$C$5:$C$19,A${r})`);
    cell(
      dashboard,
      r,
      3,
      `=SUMIF(Projects!$C$5:$C$19,A${r},Projects!$G$5:$G$19)`,
      "money",
    );
    cell(
      dashboard,
      r,
      4,
      `=SUMIF(Projects!$C$5:$C$19,A${r},Projects!$K$5:$K$19)`,
      "money",
    );
  });
  cell(
    dashboard,
    24,
    1,
    "TRY IT → Change the scenario multiplier or pipeline probability on Assumptions to stress-test the plan.",
    "subtitle",
  );
  dashboard.mergeData.push({
    startRow: 23,
    endRow: 23,
    startColumn: 0,
    endColumn: 8,
  });
  dashboard.freeze = { xSplit: 0, ySplit: 2, startRow: 2, startColumn: -1 };
  return book;
}
