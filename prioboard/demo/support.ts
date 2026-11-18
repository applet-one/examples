import { expect, type APIRequestContext, type Page } from "@playwright/test";
export const origin = "http://127.0.0.1:8796";
export function assertTarget(baseURL: string | undefined) {
  expect(
    baseURL,
    "Never authenticate or mutate against a target override",
  ).toBe(origin);
  if (process.env.DEMOTALE_BASE_URL && process.env.DEMOTALE_BASE_URL !== origin)
    throw new Error("Local target required");
}
export async function login(request: APIRequestContext, input: object) {
  const response = await request.post(`${origin}/api/profile`, {
    headers: { Origin: origin },
    data: input,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).user;
}
export async function dataset(request: APIRequestContext) {
  const response = await request.get(`${origin}/api/dataset`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()).dataset;
}
export async function center(page: Page, selector: string) {
  // Scroll framing only; no application CSS or state changes.
  await page
    .locator(selector)
    .first()
    .evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
}
