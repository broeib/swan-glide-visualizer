import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface OutputManifest {
  title?: string;
  mood?: string;
  key?: string;
  bpm?: number;
  instrument?: string;
  theme?: string;
  chordNames?: string[];
  totalBeats?: number;
  videoFile?: string;
  coverFile?: string;
  captionFile?: string;
  createdAt?: string;
}

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function scanOutputDirectory(outputRoot: string) {
  if (!fs.existsSync(outputRoot)) {
    return [];
  }

  const items: Array<Record<string, unknown>> = [];
  const dateEntries = fs
    .readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name));

  for (const dateEntry of dateEntries) {
    const dateDir = path.join(outputRoot, dateEntry.name);
    const songEntries = fs
      .readdirSync(dateDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());

    for (const songEntry of songEntries) {
      const songDir = path.join(dateDir, songEntry.name);
      const manifestPath = path.join(songDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;

      try {
        const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(rawManifest) as OutputManifest;
        const videoFile = manifest.videoFile || 'video.mp4';
        const coverFile = manifest.coverFile || 'cover.jpg';
        const captionFile = manifest.captionFile || 'caption.txt';

        const videoPath = path.join(songDir, videoFile);
        if (!fs.existsSync(videoPath)) continue;

        const coverPath = path.join(songDir, coverFile);
        const captionPath = path.join(songDir, captionFile);
        const caption = fs.existsSync(captionPath)
          ? fs.readFileSync(captionPath, 'utf-8').trim()
          : '';

        const baseUrl = `output/${encodeURIComponent(dateEntry.name)}/${encodeURIComponent(songEntry.name)}`;

        items.push({
          id: `${dateEntry.name}/${songEntry.name}`,
          date: dateEntry.name,
          slug: songEntry.name,
          title: manifest.title || songEntry.name,
          mood: manifest.mood || 'unknown',
          key: manifest.key || '',
          bpm: manifest.bpm ?? 0,
          instrument: manifest.instrument || 'guitar',
          theme: manifest.theme || 'pastel',
          chordNames: Array.isArray(manifest.chordNames)
            ? manifest.chordNames
            : [],
          totalBeats: manifest.totalBeats ?? 0,
          createdAt: manifest.createdAt || '',
          videoUrl: `${baseUrl}/${encodeURIComponent(videoFile)}`,
          coverUrl: fs.existsSync(coverPath)
            ? `${baseUrl}/${encodeURIComponent(coverFile)}`
            : null,
          caption,
        });
      } catch {
        // Skip malformed manifest entries
      }
    }
  }

  items.sort((a, b) => {
    const dateCmp = String(b.date).localeCompare(String(a.date));
    if (dateCmp !== 0) return dateCmp;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  return items;
}

function serveOutputFile(
  req: IncomingMessage,
  res: ServerResponse,
  outputRoot: string,
  reqUrl: string
): boolean {
  const pathname = decodeURIComponent(reqUrl.split('?')[0] || '');
  if (!pathname.startsWith('/output/')) {
    return false;
  }

  const relativePath = pathname.slice('/output/'.length);
  const resolvedPath = path.resolve(outputRoot, relativePath);

  if (
    resolvedPath !== outputRoot &&
    !resolvedPath.startsWith(outputRoot + path.sep)
  ) {
    res.statusCode = 403;
    res.end('Forbidden');
    return true;
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    res.statusCode = 404;
    res.end('Not found');
    return true;
  }

  const stat = fs.statSync(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const totalSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-cache');

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      res.end();
      return true;
    }

    const start = match[1] ? Number.parseInt(match[1], 10) : 0;
    const end = match[2]
      ? Math.min(Number.parseInt(match[2], 10), totalSize - 1)
      : totalSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= totalSize) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      res.end();
      return true;
    }

    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(resolvedPath, { start, end }).pipe(res);
    return true;
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', totalSize);
  fs.createReadStream(resolvedPath).pipe(res);
  return true;
}

function attachOutputMiddleware(
  middlewares: {
    use: (
      fn: (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void
      ) => void
    ) => void;
  },
  outputRoot: string
) {
  middlewares.use((req, res, next) => {
    const reqUrl = req.url || '';
    const pathname = reqUrl.split('?')[0] || '';

    if (pathname === '/api/outputs' || pathname === '/outputs.json') {
      const items = scanOutputDirectory(outputRoot);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(JSON.stringify({ items }));
      return;
    }

    if (serveOutputFile(req, res, outputRoot, reqUrl)) {
      return;
    }

    next();
  });
}

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (
      entry.isFile() &&
      !entry.name.endsWith('.log') &&
      !entry.name.endsWith('.wav') &&
      !entry.name.startsWith('temp_')
    ) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function outputGalleryPlugin(): Plugin {
  const outputRoot = path.resolve(process.cwd(), 'output');
  let resolvedOutDir = path.resolve(process.cwd(), 'dist');

  return {
    name: 'swan-glide-output-gallery',
    configResolved(config) {
      resolvedOutDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      attachOutputMiddleware(server.middlewares, outputRoot);
    },
    configurePreviewServer(server) {
      attachOutputMiddleware(server.middlewares, outputRoot);
    },
    writeBundle() {
      const items = scanOutputDirectory(outputRoot);
      fs.mkdirSync(resolvedOutDir, { recursive: true });
      fs.writeFileSync(
        path.join(resolvedOutDir, 'outputs.json'),
        JSON.stringify({ items }),
        'utf-8'
      );
      copyDirSync(outputRoot, path.join(resolvedOutDir, 'output'));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), outputGalleryPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
