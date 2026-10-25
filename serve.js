// Local preview only. The deployed tool needs no Node server.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/timer.js':'timer.js','/alarm.js':'alarm.js','/assets/logo-128.webp':'assets/logo-128.webp'};
const types = {html:'text/html',css:'text/css',js:'text/javascript',webp:'image/webp'};
createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname.replace(/^\/pomodoro(?=\/)/, '');
  if (!files[path]) { response.writeHead(404); response.end('Not found'); return; }
  try { const file = files[path]; response.writeHead(200, {'Content-Type':`${types[file.split('.').pop()]}; charset=utf-8`}); response.end(await readFile(new URL(file, import.meta.url))); }
  catch { response.writeHead(500); response.end('Unable to read file'); }
}).listen(4173, '127.0.0.1', () => console.log('Pomodoro preview: http://127.0.0.1:4173/'));
