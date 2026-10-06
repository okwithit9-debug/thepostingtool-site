"use strict";
// Zero-dependency static server for thepostingtool.com.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
};

// Removed pages -> new home.
const REDIRECTS = {
  "/commercial": "/",
  "/commercial-thanks": "/",
  "/commercial-terms": "/",
  "/factory-vs-scheduler": "/compare",
};

// .html files that may be served directly without a redirect.
const DIRECT_HTML = new Set(["/setup.html", "/terms.html"]);

// Repo files that must never be served.
const BLOCKED = new Set(["/server.js"]);

// Byte-range responses so <video> works (Safari requires 206 support).
function sendRange(req, res, file, headers) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    const base = Object.assign({ "Content-Type": type, "Accept-Ranges": "bytes" }, headers || {});
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (!m || (m[1] === "" && m[2] === "")) {
      res.writeHead(200, Object.assign(base, { "Content-Length": st.size }));
      if (req.method === "HEAD") return res.end();
      return fs.createReadStream(file).pipe(res);
    }
    let start, end;
    if (m[1] === "") {
      start = Math.max(0, st.size - Number(m[2]));
      end = st.size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === "" ? st.size - 1 : Math.min(Number(m[2]), st.size - 1);
    }
    if (start > end || start >= st.size) {
      res.writeHead(416, { "Content-Range": "bytes */" + st.size });
      return res.end();
    }
    res.writeHead(206, Object.assign(base, {
      "Content-Range": "bytes " + start + "-" + end + "/" + st.size,
      "Content-Length": end - start + 1,
    }));
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  });
}

function send(res, status, file, headers) {
  fs.readFile(file, (err, data) => {
    if (err) return notFound(res);
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    res.writeHead(status, Object.assign({ "Content-Type": type }, headers || {}));
    res.end(data);
  });
}

function notFound(res) {
  fs.readFile(path.join(ROOT, "404.html"), (err, data) => {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(err ? "Not found" : data);
  });
}

function redirect(res, location) {
  res.writeHead(301, { Location: location });
  res.end();
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return notFound(res);
  }
  if (pathname.includes("\0") || pathname.includes("..")) return notFound(res);

  // Strip trailing slash (except root).
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return redirect(res, pathname.replace(/\/+$/, ""));
  }

  const bare = pathname.replace(/\.html$/, "");
  if (REDIRECTS[bare]) return redirect(res, REDIRECTS[bare]);

  if (pathname === "/" || pathname === "/index.html") {
    if (pathname === "/index.html") return redirect(res, "/");
    return send(res, 200, path.join(ROOT, "index.html"));
  }

  if (pathname.endsWith(".html")) {
    const file = path.join(ROOT, pathname);
    if (pathname === "/404.html" || !isFile(file)) return notFound(res);
    if (DIRECT_HTML.has(pathname)) return send(res, 200, file);
    return redirect(res, bare);
  }

  const ext = path.extname(pathname);
  if (ext) {
    const file = path.join(ROOT, pathname);
    if (TYPES[ext] && ext !== ".html" && !BLOCKED.has(pathname) && isFile(file)) {
      if (ext === ".mp4") return sendRange(req, res, file, { "Cache-Control": "public, max-age=86400" });
      return send(res, 200, file, { "Cache-Control": "public, max-age=3600" });
    }
    return notFound(res);
  }

  const page = path.join(ROOT, pathname + ".html");
  if (pathname !== "/404" && isFile(page)) return send(res, 200, page);
  return notFound(res);
});

server.listen(PORT, () => {
  console.log("thepostingtool.com listening on " + PORT);
});
