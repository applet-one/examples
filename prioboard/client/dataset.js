import { limits, isDatasetPath, validateDataset } from "../shared/paths.js";
import { state } from "./state.js";

export async function readFolder(fileList) {
  const files = [...fileList];
  const roots = new Set(
    files.map((file) => file.webkitRelativePath.split("/")[0]),
  );
  if (roots.size !== 1) throw new Error("Choose one top-level folder");
  const name = [...roots][0];
  const selected = files
    .map((file) => ({
      file,
      path: file.webkitRelativePath.slice(name.length + 1),
    }))
    .filter(({ path }) => isDatasetPath(path));
  if (!selected.length)
    throw new Error(
      "No Markdown files found under context/, input/, or output/. Choose data/ (or an extracted dataset folder).",
    );
  if (selected.length > limits.files)
    throw new Error("Too many files (maximum 1,000)");
  if (selected.some(({ file }) => file.size > limits.fileBytes))
    throw new Error("A Markdown file exceeds 5 MB");
  if (
    selected.reduce((sum, { file }) => sum + file.size, 0) > limits.totalBytes
  )
    throw new Error("Folder Markdown exceeds 25 MB");
  const entries = await Promise.all(
    selected.map(async ({ file, path }) => ({
      path,
      content: await file.text(),
    })),
  );
  return validateDataset({ name, files: entries });
}

export function applyDataset(dataset) {
  const previous = state.run;
  state.files = new Map(dataset.files.map((file) => [file.path, file.content]));
  state.root = dataset.name;
  state.uploadedAt = dataset.uploadedAt;
  state.overrides = dataset.overrides || [];
  state.comments = dataset.comments || [];
  state.commentDrafts.clear();
  state.overrideRevision = dataset.overrideRevision || 0;
  state.reports.clear();
  state.runs = [
    ...new Set(
      dataset.files
        .map(({ path }) => path.match(/^output\/(\d{4}-\d{2}-\d{2})\//)?.[1])
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  state.run = state.runs.includes(previous) ? previous : state.runs[0] || "";
  state.folder = {
    input: "input",
    context: "context",
    output: state.run ? `output/${state.run}` : "output",
  };
  state.selected = {};
  state.filter = "";
  state.loadWarnings = [];
  for (const group of ["input", "context", "output"])
    if (!dataset.files.some((file) => file.path.startsWith(`${group}/`)))
      state.loadWarnings.push(`No Markdown files found in ${group}/.`);
}

export function datasetStatus() {
  return `${state.files.size} saved Markdown files from ${state.root} · uploaded ${new Date(state.uploadedAt).toLocaleString()}. File badges count documents, not individual messages.`;
}
