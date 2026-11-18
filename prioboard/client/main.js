import { $, icon } from "./dom.js";
import { initProfile } from "./components/profile.js";
import { startCollaboration } from "./collaboration.js";
import { state } from "./state.js";
import { render, setView } from "./ui.js";
import { fetchDataset, replaceDataset } from "./api.js";
import { readFolder, applyDataset, datasetStatus } from "./dataset.js";

async function uploadFolder(fileList) {
  if (!fileList.length || state.loading || !state.user?.isAdmin) return;
  state.loading = true;
  render();
  $("#status").textContent = "Reading Markdown files…";
  try {
    const dataset = await readFolder(fileList);
    const replacement = state.root
      ? "This replaces ALL saved files, including removing files absent from this folder."
      : "This saves the folder in your private Applet.";
    if (
      !window.confirm(
        `Upload ${dataset.files.length} Markdown files from “${dataset.name}”?\n\n${replacement}\n\nOnly Markdown under context/, input/, and output/ is uploaded.`,
      )
    ) {
      $("#status").textContent = state.root
        ? datasetStatus()
        : "Upload cancelled. No dataset saved.";
      return;
    }
    $("#status").textContent = "Saving dataset…";
    const saved = await replaceDataset(dataset);
    const hadOverrides = state.overrides.length > 0;
    applyDataset({ ...dataset, ...saved, files: dataset.files });
    $("#status").textContent =
      datasetStatus() +
      (hadOverrides && !state.overrides.length
        ? " Manual overrides were cleared because the underlying data changed."
        : "");
  } catch (error) {
    $("#status").textContent =
      `Upload not confirmed: ${error.message}. Reload to check saved state if the connection was interrupted.`;
  } finally {
    state.loading = false;
    render();
  }
}

$("#open-folder").addEventListener("click", () => $("#folder-input").click());
$("#folder-input").addEventListener("change", async (event) => {
  await uploadFolder(event.target.files);
  event.target.value = "";
});
$("#download").addEventListener("click", () => {
  window.location.assign("/api/dataset/download");
});
document
  .querySelectorAll("[data-view]")
  .forEach((button) =>
    button.addEventListener("click", () => setView(button.dataset.view)),
  );
$("#close-dialog").addEventListener("click", () => $("#source-dialog").close());
$("#source-dialog").addEventListener("click", (event) => {
  if (event.target !== $("#source-dialog")) return;
  const rect = event.target.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    event.target.close();
});
document
  .querySelectorAll("[data-icon]")
  .forEach((node) => node.replaceWith(icon(node.dataset.icon)));

await initProfile();
state.loading = true;
render();
$("#status").textContent = "Loading saved dataset…";
try {
  const dataset = await fetchDataset();
  if (dataset) {
    applyDataset(dataset);
    $("#status").textContent = datasetStatus();
  } else
    $("#status").textContent = "No saved dataset. Upload data/ to begin.";
} catch (error) {
  $("#status").textContent =
    `Could not load saved dataset: ${error.message}. Reload to retry.`;
} finally {
  state.loading = false;
  render();
}
startCollaboration();
