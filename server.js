const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveFilePath(reqUrl) {
  const cleanPath = reqUrl.split('?')[0].split('#')[0];
  let norm = decodeURIComponent(cleanPath);

  if (norm === '/' || norm === '') {
    norm = '/index.html';
  }

  // 1. Direct match
  let fullPath = path.join(PUBLIC_DIR, norm);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // 2. Case-insensitive /css/ -> /CSS/
  if (/^\/css\//i.test(norm)) {
    const cssVariant = norm.replace(/^\/css\//i, '/CSS/');
    fullPath = path.join(PUBLIC_DIR, cssVariant);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  // 3. Case-insensitive /scripts/ -> /Scripts/
  if (/^\/scripts\//i.test(norm)) {
    const scriptVariant = norm.replace(/^\/scripts\//i, '/Scripts/');
    fullPath = path.join(PUBLIC_DIR, scriptVariant);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  // 4. Check in root folder by basename
  const baseName = path.basename(norm);
  fullPath = path.join(PUBLIC_DIR, baseName);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // 5. Fallback for SPA routing
  if (!path.extname(norm)) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

function handleRequest(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + req.url);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Error: ' + err.message);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(data);
  });
}

// Export for Vercel Serverless
module.exports = handleRequest;

// Run standalone server when executed directly: node server.js
if (require.main === module || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}
