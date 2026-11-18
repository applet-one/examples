export const limits = Object.freeze({
  files: 1000,
  fileBytes: 5 * 1024 * 1024,
  totalBytes: 25 * 1024 * 1024,
  requestBytes: 32 * 1024 * 1024,
});
const encoder = new TextEncoder();

export function safePath(path) {
  if (
    typeof path !== "string" ||
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    /[\x00-\x1f\x7f]/.test(path) ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Unsafe file path");
  }
}

export function isDatasetPath(path) {
  safePath(path);
  return (
    /^(context|input|output)\/.+\.md$/i.test(path) &&
    !path.split("/").some((part) => part.startsWith("."))
  );
}

// File paths are logical dataset paths, never filesystem paths or ZIP destinations supplied by the client.
export function validateDataset(dataset) {
  if (
    !dataset ||
    typeof dataset !== "object" ||
    typeof dataset.name !== "string" ||
    !dataset.name.trim() ||
    dataset.name.length > 200 ||
    /[\x00-\x1f\x7f]/.test(dataset.name)
  )
    throw new Error("Invalid dataset name");
  if (
    !Array.isArray(dataset.files) ||
    !dataset.files.length ||
    dataset.files.length > limits.files
  )
    throw new Error(`Expected 1–${limits.files} Markdown files`);
  const seen = new Set();
  let bytes = 0;
  for (const file of dataset.files) {
    if (!file || !isDatasetPath(file.path))
      throw new Error(
        "Only Markdown under context/, input/, and output/ is allowed",
      );
    if (file.path.length > 1024)
      throw new Error("File path exceeds 1,024 characters");
    if (seen.has(file.path))
      throw new Error(`Duplicate file path: ${file.path}`);
    seen.add(file.path);
    if (typeof file.content !== "string")
      throw new Error(`Expected text: ${file.path}`);
    const size = encoder.encode(file.content).length;
    if (size > limits.fileBytes)
      throw new Error(`File exceeds 5 MB: ${file.path}`);
    bytes += size;
    if (bytes > limits.totalBytes)
      throw new Error("Folder Markdown exceeds 25 MB");
  }
  return {
    name: dataset.name,
    files: dataset.files.map(({ path, content }) => ({ path, content })),
    bytes,
  };
}
