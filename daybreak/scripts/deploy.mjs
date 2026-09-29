// Deploy an existing app through the Applet API. The current `applet deploy` CLI
// tries to create the app first, which fails when the account is at its app limit.
// This uses the same builder and deployment endpoints as the installed CLI.
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const cli = realpathSync(execFileSync('which', ['applet'], { encoding: 'utf8' }).trim());
const { buildAppletProject } = await import(pathToFileURL(resolve(dirname(cli), '../lib/builder.js')).href);
const { access_token, expires_at } = JSON.parse(readFileSync(resolve(process.env.XDG_CONFIG_HOME || resolve(homedir(), '.config'), 'applet-one/config.json'), 'utf8'));
if (expires_at <= new Date().toISOString()) throw Error('Applet login expired; run `applet login`.');
const base = process.env.APPLET_API_URL || 'https://api.applet.one/api/v1';
async function request(path, options = {}) {
  const response = await fetch(base + path, { ...options, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + access_token, ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw Error(result.error?.message || `Applet API returned ${response.status}`);
  return result.data;
}
console.log('Building Worker...');
const build = await buildAppletProject({ cwd: process.cwd() });
const me = await request('/me');
const namespace = me.namespaces?.[0]?.slug;
if (!namespace) throw Error('No Applet namespace found.');
const endpoint = `/namespaces/${encodeURIComponent(namespace)}/apps/${encodeURIComponent(build.config.name)}`;
const current = await request(endpoint); // Existing app: never try to create another one.
const access = build.config.applet?.access || 'public';
if (current.app.access !== access) await request(endpoint + '/access', { method: 'PATCH', body: JSON.stringify({ access }) });
const { artifact } = await build.createArtifact({ appId: current.app.id });
console.log('Uploading artifact...');
const deployment = await request(endpoint + '/deployments', { method: 'POST', body: '{}' });
const uploaded = await fetch(deployment.upload.url, { method: deployment.upload.method, headers: { 'content-type': 'application/gzip' }, body: artifact });
if (!uploaded.ok) throw Error('Artifact upload failed: ' + uploaded.status);
await request(endpoint + '/deployments/' + deployment.deployment.id + '/finalize', { method: 'POST', body: JSON.stringify({ sha256: createHash('sha256').update(artifact).digest('hex') }) });
for (let i = 0; i < 60; i++) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const { deployment: latest } = await request(endpoint + '/deployments/' + deployment.deployment.id);
  if (latest.status === 'live') { console.log('Deployed: ' + current.app.url); process.exit(0); }
  if (latest.status === 'failed') throw Error(latest.error_message || 'Deployment failed.');
}
throw Error('Deployment is still processing; check `applet status`.');
