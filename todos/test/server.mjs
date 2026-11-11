// Loopback-only browser-test adapter. The production deployment uses celld.
import { createServer } from 'node:http';
import { app } from './helpers.js';
const a = app();
const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request('http://127.0.0.1:8789' + incoming.url, {
      method: incoming.method, headers: incoming.headers,
      ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body }),
    });
    const response = await a.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); outgoing.writeHead(500); outgoing.end('Test server failure'); }
});
server.listen(8789, '127.0.0.1', () => console.log('Todo test server ready'));
process.on('SIGTERM', () => server.close(() => { a.close(); process.exit(0); }));
