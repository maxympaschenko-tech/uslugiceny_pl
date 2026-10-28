import { createReadStream, realpathSync } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
};

export function createStaticServer(directory = fileURLToPath(new URL('../dist/', import.meta.url))) {
  const root = realpathSync(directory);
  const insideRoot = file => {
    const path = relative(root, file);
    return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
  };
  return createServer(async (request, response) => {
    const fail = (status, message) => {
      response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('allow', 'GET, HEAD');
      return fail(405, '405 Method Not Allowed');
    }
    let pathname;
    try {
      pathname = decodeURIComponent(request.url.split('?')[0]);
      if (pathname.includes('\0') || !pathname.startsWith('/')) return fail(400, '400 Bad Request');
    } catch {
      return fail(400, '400 Bad Request');
    }
    let file = resolve(root, `.${pathname}`);
    if (!insideRoot(file)) return fail(403, '403 Forbidden');
    try {
      let info = await stat(file);
      if (info.isDirectory()) {
        file = resolve(file, 'index.html');
        info = await stat(file);
      }
      if (!info.isFile()) return fail(404, '404 Not Found');
      file = await realpath(file);
      if (!insideRoot(file)) return fail(403, '403 Forbidden');
      response.writeHead(200, {
        'content-type': contentTypes[extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': info.size,
        'x-content-type-options': 'nosniff',
      });
      if (request.method === 'HEAD') return response.end();
      const stream = createReadStream(file);
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      fail(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500,
        error.code === 'ENOENT' || error.code === 'ENOTDIR' ? '404 Not Found' : '500 Internal Server Error');
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  createStaticServer().listen(4321, () => console.log('Serwer lokalny: http://localhost:4321'));
}
