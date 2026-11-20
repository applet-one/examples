import "./styles.css";
import { blankWorkbook, MAX_BYTES } from "../shared/contracts.js";
import { studioWorkbook } from "../shared/sample-workbook.js";
import { csvWorkbook, exportCsv } from "../shared/csv.js";
import { openRecovery, SaveCoordinator } from "./persistence.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
let db,
  coordinator,
  editor,
  current,
  navigating = false;
let storageWarning = "";
try {
  db = await openRecovery();
} catch {
  storageWarning =
    "Browser recovery storage is unavailable. Keep this tab open until cloud save succeeds.";
}

export async function api(path = "", method = "GET", body) {
  const encoded = body === undefined ? undefined : JSON.stringify(body);
  if (encoded && new TextEncoder().encode(encoded).length > MAX_BYTES)
    throw Object.assign(
      new Error("Request exceeds 5 MiB. Your local recovery copy is retained."),
      { status: 413 },
    );
  const response = await fetch(`/api/workbooks${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: encoded,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "Request failed."), {
      status: response.status,
    });
  return data;
}
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) if (child != null) node.append(child);
  return node;
}
function button(label, action, className = "") {
  return el(
    "button",
    { type: "button", class: className, onclick: action },
    label,
  );
}
function notice(message) {
  const node = document.querySelector("#notice");
  if (node) {
    node.textContent = message;
    node.hidden = !message;
  }
}
function warning(message) {
  storageWarning = message;
  const node = document.querySelector("#storage-warning");
  if (node) {
    node.textContent = message;
    node.hidden = !message;
  }
}
function shell(...children) {
  app.replaceChildren(
    ...children,
    el("p", { id: "notice", role: "alert", hidden: "" }),
    el(
      "p",
      {
        id: "storage-warning",
        role: "status",
        ...(storageWarning ? {} : { hidden: "" }),
      },
      storageWarning,
    ),
  );
}
async function choose(heading, message, choices, inputValue) {
  if (dialog.open) dialog.close();
  dialog.classList.remove("workbook-picker");
  return new Promise((resolve) => {
    const field =
      inputValue === undefined
        ? null
        : el("input", {
            value: inputValue,
            maxlength: "120",
            required: "",
            "aria-label": "Workbook title",
          });
    const close = (value) => {
      dialog.close();
      resolve(value);
    };
    const form = el(
      "form",
      {
        onsubmit: (e) => {
          e.preventDefault();
          close(field ? field.value : choices[0]);
        },
      },
      el("h2", {}, heading),
      el("p", {}, message),
      field,
      el(
        "div",
        { class: "dialog-actions" },
        choices.map((label, i) =>
          button(
            label,
            () => close(field && i === 0 ? field.value : label),
            i === 0 ? "primary" : "",
          ),
        ),
      ),
    );
    dialog.replaceChildren(form);
    dialog.oncancel = () => resolve(null);
    dialog.showModal();
    (field || form.querySelector("button")).focus();
    field?.select();
  });
}
async function records(id) {
  try {
    return db
      ? (await db.all())
          .filter((r) => !id || r.id === id)
          .sort((a, b) => b.timestamp - a.timestamp)
      : [];
  } catch {
    warning("Browser recovery storage is unavailable. Cloud saves still work.");
    return [];
  }
}
function dirty(record) {
  return record.pending || record.generation > record.savedGeneration;
}
async function persist(record, key) {
  if (!db) throw new Error("Browser recovery is unavailable.");
  try {
    await db.put({ ...record, key });
  } catch (error) {
    warning(
      "Local recovery failed (storage unavailable or full). Do not close until cloud save succeeds.",
    );
    throw error;
  }
}
async function newWorkbook(sample = false) {
  try {
    const snapshot = sample ? studioWorkbook() : blankWorkbook();
    const data = await api("", "POST", { title: snapshot.name, snapshot });
    await go(data.id);
  } catch (error) {
    notice(error.message);
  }
}
async function workbookPicker() {
  if (dialog.open) dialog.close();
  const list = el("div", { class: "workbook-list" });
  const recoveryList = el("section", { class: "recoveries" });
  const message = el("p", { role: "status" }, "Loading workbooks…");
  const run = async (action) => {
    try {
      await action();
    } catch (error) {
      message.textContent = error.message;
      notice(error.message);
    }
  };
  dialog.classList.add("workbook-picker");
  dialog.replaceChildren(
    el(
      "div",
      { class: "section-heading" },
      el("h2", {}, "Open workbook"),
      button("Close", () => dialog.close()),
    ),
    el(
      "div",
      { class: "picker-actions" },
      button(
        "New blank spreadsheet",
        () => {
          dialog.close();
          newWorkbook();
        },
        "primary",
      ),
      button("Refresh", workbookPicker),
    ),
    message,
    list,
    recoveryList,
    el(
      "p",
      { class: "public-warning" },
      "No sign-in: anyone with this app’s URL can read and change its workbooks.",
    ),
  );
  dialog.oncancel = null;
  dialog.showModal();
  try {
    const workbooks = await api();
    message.textContent = workbooks.length
      ? "Most recently saved first."
      : "No workbooks yet. Create a blank spreadsheet to start.";
    for (const book of workbooks) {
      list.append(
        el(
          "article",
          { class: "workbook-card" },
          button(
            book.title,
            () => {
              dialog.close();
              if (current?.id !== book.id) go(book.id);
            },
            "workbook-open",
          ),
          el(
            "p",
            {},
            `Saved ${new Date(book.updatedAt).toLocaleString()} · revision ${book.revision}`,
          ),
          el(
            "div",
            { class: "card-actions" },
            button("Rename", () =>
              run(async () => {
                dialog.close();
                await renameWorkbook(book);
                await workbookPicker();
              }),
            ),
            button("Duplicate", () =>
              run(async () => {
                await api(`/${book.id}/duplicate`, "POST", {});
                await workbookPicker();
              }),
            ),
            button("Delete", () =>
              run(async () => {
                if (current?.id === book.id && coordinator?.dirty)
                  throw new Error(
                    "Save or preserve your local edits before deleting the open workbook.",
                  );
                const action = await choose(
                  "Delete workbook?",
                  `“${book.title}” will be permanently removed from cloud storage. Browser recovery copies are separate.`,
                  ["Delete", "Cancel"],
                );
                if (action === "Delete") {
                  await api(`/${book.id}`, "DELETE", {
                    baseRevision: book.revision,
                  });
                  if (current?.id === book.id) {
                    await go("");
                    return;
                  }
                }
                await workbookPicker();
              }),
            ),
          ),
        ),
      );
    }
  } catch (error) {
    message.textContent = `Cloud unavailable: ${error.message} Cached workbooks can still be opened below.`;
  }
  const cached = await records();
  if (cached.length) {
    recoveryList.append(
      el("h3", {}, "On this browser"),
      el("p", {}, "Recovery copies are separate from cloud backups."),
    );
    for (const record of cached)
      recoveryList.append(
        el(
          "div",
          { class: "recovery-row" },
          el(
            "span",
            {},
            `${record.snapshot.name} · ${dirty(record) ? "Unsaved recovery" : "Cached"} · ${new Date(record.timestamp).toLocaleString()}`,
          ),
          button("Open", () => {
            dialog.close();
            go(record.id);
          }),
          button("Save as new workbook", () =>
            run(async () => {
              dialog.close();
              await recoverCopy(record);
            }),
          ),
          button("Remove local copy", () =>
            run(async () => {
              if (
                (await choose(
                  "Remove browser copy?",
                  "Unsaved local work in this copy will be discarded. Cloud workbooks are unchanged.",
                  ["Remove", "Cancel"],
                )) === "Remove"
              )
                await db.delete(record.key);
              await workbookPicker();
            }),
          ),
        ),
      );
  }
}
async function renameWorkbook(book = current) {
  if (!book) return;
  if (current?.id === book.id && coordinator?.dirty) {
    await coordinator.flush();
    if (coordinator.dirty)
      throw new Error("Wait for your edits to save before renaming.");
  }
  const name = await choose(
    "Rename workbook",
    "Choose a title for this spreadsheet.",
    ["Rename", "Cancel"],
    book.title,
  );
  if (!name || name === "Cancel") return;
  const result = await api(`/${book.id}`, "PATCH", {
    title: name,
    baseRevision:
      current?.id === book.id ? coordinator.revision : book.revision,
  });
  if (current?.id === book.id) {
    current.title = result.title;
    coordinator.revision = result.revision;
    document.querySelector(".editor-title").textContent = result.title;
    document.title = `${result.title} · Sheets`;
    coordinator.local();
  }
}
async function importCsvFile() {
  if (dialog.open) dialog.close();
  dialog.classList.remove("workbook-picker");
  const file = el("input", {
    type: "file",
    accept: ".csv,.tsv,text/csv,text/tab-separated-values",
    required: "",
    "aria-label": "CSV file",
  });
  const delimiter = el(
    "select",
    { "aria-label": "Delimiter" },
    el("option", { value: "auto" }, "Detect automatically"),
    el("option", { value: "," }, "Comma"),
    el("option", { value: ";" }, "Semicolon"),
    el("option", { value: "\t" }, "Tab"),
  );
  const message = el("p", { role: "alert" });
  const submit = el("button", { type: "submit", class: "primary" }, "Import");
  const cancel = button("Cancel", () => dialog.close());
  let busy = false;
  dialog.oncancel = (event) => {
    if (busy) event.preventDefault();
  };
  dialog.replaceChildren(
    el(
      "form",
      {
        onsubmit: async (event) => {
          event.preventDefault();
          if (busy) return;
          const selected = file.files[0];
          if (!selected) return;
          busy = true;
          submit.disabled = cancel.disabled = true;
          try {
            if (selected.size > MAX_BYTES)
              throw new Error("CSV files must be at most 5 MiB.");
            let text;
            try {
              text = new TextDecoder("utf-8", { fatal: true }).decode(
                await selected.arrayBuffer(),
              );
            } catch {
              throw new Error(
                "This file is not valid UTF-8. Save it as UTF-8 CSV and try again.",
              );
            }
            const snapshot = csvWorkbook(
              text,
              selected.name.replace(/\.(csv|tsv)$/i, ""),
              delimiter.value,
            );
            const data = await api("", "POST", {
              title: snapshot.name,
              snapshot,
            });
            dialog.close();
            await go(data.id);
          } catch (error) {
            message.textContent = error.message;
          } finally {
            busy = false;
            submit.disabled = cancel.disabled = false;
          }
        },
      },
      el("h2", {}, "Import CSV"),
      el(
        "p",
        {},
        "Import UTF-8 CSV as a new workbook. Your current workbook is not replaced. Numbers use a decimal point; dates, identifiers, and formula-like text stay as text.",
      ),
      el("label", {}, "CSV file", file),
      el("label", { class: "csv-delimiter" }, "Delimiter", delimiter),
      el(
        "p",
        { class: "public-warning" },
        "Limit: 5 MiB, 50,000 rows, 1,000 columns, and 200,000 cells. CSV does not include styles or multiple worksheets.",
      ),
      message,
      el("div", { class: "dialog-actions" }, cancel, submit),
    ),
  );
  dialog.showModal();
  file.focus();
}
async function exportActiveCsv() {
  const instance = editor;
  if (!instance) return;
  await instance.api.getFormula().onCalculationResultApplied(5000);
  if (editor !== instance)
    throw new Error("The workbook changed. Try exporting again.");
  const activeId = instance.api
    .getActiveWorkbook()
    .getActiveSheet()
    .getSheetId();
  const sheet = instance.capture().sheets[activeId];
  const content = exportCsv(sheet);
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = el("a", {
    href: url,
    download: `${current.title} - ${sheet.name}.csv`.replace(
      /[\\/:*?"<>|\u0000-\u001f]/g,
      "_",
    ),
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(
    "CSV exported: active worksheet values only, without formatting. Formula-like text is prefixed with an apostrophe for safe opening in other spreadsheet apps.",
  );
}
function fileMenu() {
  const menu = el("details", { class: "file-menu" });
  const action = (label, fn) =>
    button(label, async () => {
      menu.open = false;
      try {
        await fn();
      } catch (error) {
        notice(error.message);
      }
    });
  menu.append(
    el("summary", {}, "File"),
    el(
      "div",
      { class: "file-menu-items" },
      action("New blank spreadsheet", () => newWorkbook()),
      action("Open workbook…", workbookPicker),
      action("Import CSV…", importCsvFile),
      action("Export CSV…", exportActiveCsv),
      action("Save now", () => coordinator?.flush()),
      action("Save as copy…", async () => {
        const snapshot = coordinator.capture();
        const data = await api("", "POST", {
          title: `${current.title.slice(0, 113)} (copy)`,
          snapshot,
        });
        await go(data.id);
      }),
      action("Rename…", () => renameWorkbook()),
      action("Try the studio example", () => newWorkbook(true)),
    ),
  );
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  return menu;
}
async function latestWorkbook() {
  let workbooks;
  try {
    workbooks = await api();
  } catch (error) {
    const cached = await records();
    if (!error.status && cached.length) return cached[0].id;
    throw error;
  }
  if (workbooks.length) return workbooks[0].id;
  const snapshot = blankWorkbook();
  return (await api("", "POST", { title: snapshot.name, snapshot })).id;
}
async function recoverCopy(record) {
  const data = await api("", "POST", {
    title: `${record.snapshot.name.slice(0, 108)} (recovered)`,
    snapshot: record.snapshot,
  });
  if (navigating) {
    await leave();
    history.replaceState(null, "", `#${data.id}`);
    await openWorkbook(data.id);
  } else await go(data.id);
}
async function openWorkbook(id) {
  shell(el("main", { class: "loading" }, "Opening workbook…"));
  const cached = await records(id);
  let data,
    recovery,
    offline = false;
  try {
    data = await api(`/${id}`);
  } catch (error) {
    if (error.status || !cached.length) throw error;
    recovery = cached[0];
    offline = true;
    data = {
      id,
      title: recovery.snapshot.name,
      revision: recovery.revision,
      snapshot: recovery.snapshot,
    };
  }
  const unsaved = cached.find(dirty);
  if (!offline && unsaved) {
    const sameRevision = unsaved.revision === data.revision;
    const options = [
      ...(sameRevision ? ["Restore local edits"] : []),
      "Save recovery as copy",
      "Open cloud version",
      "Cancel",
    ];
    const action = await choose(
      "Unsaved work found",
      sameRevision
        ? "This browser has edits not confirmed saved to the cloud."
        : "The cloud has advanced. Preserve your local edits as a separate workbook; no automatic merge will be made.",
      options,
    );
    if (action === "Restore local edits") {
      recovery = unsaved;
      data.snapshot = unsaved.snapshot;
    } else if (action === "Save recovery as copy") {
      await recoverCopy(unsaved);
      return;
    } else if (action !== "Open cloud version") {
      history.replaceState(null, "", location.pathname);
      showStartError("Choose another workbook, or retry to restore your work.");
      await workbookPicker();
      return;
    }
  }
  current = data;
  document.title = `${data.title} · Sheets`;
  const status = el("span", { id: "save-status", role: "status" }, "Loading");
  const last = el("span", { class: "last-save" });
  const conflict = el("div", { class: "conflict", hidden: "" });
  const container = el("div", { id: "editor" });
  const titleNode = el("h1", { class: "editor-title" }, data.title);
  shell(
    el(
      "header",
      { class: "editor-header" },
      el("span", { class: "logo" }, "▦"),
      el(
        "div",
        { class: "workbook-info" },
        titleNode,
        el("div", { class: "save-info" }, status, last),
      ),
    ),
    conflict,
    el("div", { class: "editor-workspace" }, fileMenu(), container),
  );
  const { mountEditor } = await import("./editor.js");
  let sessionCoordinator;
  const sessionEditor = mountEditor(container, data.snapshot, () =>
    sessionCoordinator?.change(),
  );
  editor = sessionEditor;
  const recoveryKey = `${id}:${crypto.randomUUID()}`;
  coordinator = sessionCoordinator = new SaveCoordinator({
    id,
    revision: data.revision,
    recovery,
    capture: () => ({ ...sessionEditor.capture(), name: data.title }),
    persist: (record) => persist(record, recoveryKey),
    send: (body) => api(`/${id}/snapshot`, "PUT", body),
    onState: (state) => {
      if (state.warning) {
        warning(state.warning);
        return;
      }
      status.textContent = state.state;
      status.dataset.state = state.state;
      last.textContent = state.savedAt
        ? `Last cloud save ${new Date(state.savedAt).toLocaleTimeString()}`
        : offline
          ? "Cached offline — not yet connected"
          : `Cloud revision ${data.revision}`;
      if (state.error) notice(state.error);
      else if (state.state === "Saved") notice("");
      if (state.state === "Conflict" || state.state === "Error") {
        conflict.hidden = false;
        conflict.replaceChildren(
          el("span", {}, state.error),
          button("Preserve as new workbook", async () => {
            try {
              await recoverCopy({ snapshot: coordinator.capture() });
            } catch (e) {
              notice(e.message);
            }
          }),
          button("Reload cloud version", async () => {
            if (
              (await choose(
                "Reload cloud version?",
                "Current local edits will not be loaded. The browser recovery copy is retained.",
                ["Reload", "Cancel"],
              )) === "Reload"
            ) {
              await leave();
              await openWorkbook(id);
            }
          }),
        );
      }
    },
  });
  // Persist a clean cache too, so an already-opened workbook can reopen offline.
  coordinator.local();
  if (offline) coordinator.emit("Offline / retrying");
  if (coordinator.dirty) coordinator.flush();
  if (offline)
    notice(
      "Offline cached workbook. Edits are local until a cloud save is acknowledged.",
    );
}
async function leave() {
  if (coordinator) {
    coordinator.stop();
    await coordinator.queue;
    coordinator = null;
  }
  editor?.dispose();
  editor = null;
  current = null;
}
async function go(id) {
  if (navigating) return;
  if (
    coordinator?.dirty &&
    (await choose(
      "Leave workbook?",
      "Unsaved work will remain in browser recovery if storage is available. For cloud durability, cancel and use Save now.",
      ["Leave", "Cancel"],
    )) !== "Leave"
  )
    return;
  navigating = true;
  try {
    await leave();
    shell(el("main", { class: "loading" }, "Opening spreadsheet…"));
    id ||= await latestWorkbook();
    history.replaceState(null, "", `#${id}`);
    await openWorkbook(id);
  } catch (error) {
    await leave();
    showStartError(error.message);
  } finally {
    navigating = false;
  }
}
function showStartError(message) {
  shell(
    el(
      "main",
      { class: "loading" },
      el("h1", {}, "Unable to open spreadsheet"),
      el("p", {}, message),
      button("Retry", () => go(location.hash.slice(1)), "primary"),
      " ",
      button("Open workbook…", workbookPicker),
    ),
  );
}
document.addEventListener("click", (event) => {
  const menu = document.querySelector(".file-menu[open]");
  if (menu && !menu.contains(event.target)) menu.open = false;
});
window.addEventListener("hashchange", () => go(location.hash.slice(1)));
window.addEventListener("beforeunload", (event) => {
  if (coordinator?.dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("online", () => coordinator?.flush());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) coordinator?.local();
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    coordinator?.flush();
  }
});
await go(location.hash.slice(1));
