import { limits } from "../shared/paths.js";

async function jsonRequest(options) {
  const response = await fetch("/api/dataset", {
    cache: "no-store",
    ...options,
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || `Request failed (${response.status})`);
  return body.dataset;
}

export async function saveOverride(input, remove = false) {
  const response = await fetch("/api/overrides", {
    method: remove ? "DELETE" : "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export async function deleteComment(input) {
  const response = await fetch("/api/comments", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || `Request failed (${response.status})`);
  return body.deletedId;
}

export async function postComment(input) {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || `Request failed (${response.status})`);
  return body.comment;
}

export function fetchDataset() {
  return jsonRequest();
}
export function replaceDataset(dataset) {
  const body = JSON.stringify(dataset);
  if (new TextEncoder().encode(body).length > limits.requestBytes)
    throw new Error("Encoded upload exceeds 32 MB");
  return jsonRequest({
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
  });
}
