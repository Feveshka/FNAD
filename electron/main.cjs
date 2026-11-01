// Оболочка для ПК: поднимает локальный сервер для dist (с Range для видео) и открывает окно.
const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.ttf': 'font/ttf', '.gz': 'application/gzip', '.webmanifest': 'application/manifest+json', '.md': 'text/plain' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let file = path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0])));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      const size = fs.statSync(file).size, type = types[path.extname(file)] || 'application/octet-stream', range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range); const start = m[1] ? parseInt(m[1], 10) : 0, end = m[2] ? parseInt(m[2], 10) : size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(file).pipe(res);
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

app.whenReady().then(async () => {
  const server = await serve();
  const win = new BrowserWindow({ width: 1280, height: 720, backgroundColor: '#050708', autoHideMenuBar: true, fullscreen: true, icon: path.join(__dirname, 'icon.png'), webPreferences: { autoplayPolicy: 'no-user-gesture-required' } });
  win.setMenuBarVisibility(false);
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen()); });
  win.loadURL(`http://127.0.0.1:${server.address().port}/index.html`);
});
app.on('window-all-closed', () => app.quit());
