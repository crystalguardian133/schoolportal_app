/**
 * Local-dev helper: serve the Laravel app (:8000) AND Reverb (:8080) through
 * a SINGLE ngrok tunnel (single-domain plans can't run two tunnels).
 *
 * Routing (by request path, Host header passed through untouched):
 *   /app/*  -> 127.0.0.1:8080 (Reverb, pusher protocol incl. WS upgrade)
 *   *       -> 127.0.0.1:8000 (Laravel app)
 *
 * Usage:
 *   1. node scripts/ngrok-proxy.mjs [port]   # default port 8090
 *   2. ngrok http 8090                       # same static domain as before
 *   3. VITE_REVERB_HOST=<that same ngrok host> (bare hostname, no scheme)
 *      VITE_REVERB_PORT=443
 *      VITE_REVERB_SCHEME=https
 *   4. restart `npm run dev` (Vite reads .env at startup) and/or rebuild.
 *
 * Nothing here is used in production; keep it out of Docker/entrypoint.
 */
import http from 'node:http';

const LISTEN_PORT = Number(process.argv[2] ?? 8090);
const APP = { host: '127.0.0.1', port: 8000 };
const REVERB = { host: '127.0.0.1', port: 8080 };

const HOP_BY_HOP = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

function isReverbPath(url) {
    return typeof url === 'string' && url.startsWith('/app/');
}

function targetFor(url) {
    return isReverbPath(url) ? REVERB : APP;
}

function cleanHeaders(incoming) {
    const out = {};
    for (const [name, value] of Object.entries(incoming)) {
        if (!HOP_BY_HOP.has(name.toLowerCase()) && value !== undefined) {
            out[name] = value;
        }
    }
    return out;
}

const server = http.createServer((req, res) => {
    const target = targetFor(req.url);
    const proxyReq = http.request(
        {
            host: target.host,
            port: target.port,
            method: req.method,
            path: req.url,
            headers: cleanHeaders(req.headers),
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
        },
    );
    proxyReq.on('error', (err) => {
        console.error(
            `[proxy] ${req.method} ${req.url} -> ${target.host}:${target.port} failed: ${err.message}`,
        );
        if (!res.headersSent) {
            res.writeHead(502, { 'content-type': 'text/plain' });
        }
        res.end('proxy: backend unavailable');
    });
    req.pipe(proxyReq);
});

// Raw TCP relay for Upgrade (websocket) requests. Unlike plain requests,
// the Upgrade/Connection headers MUST be forwarded or the backend never
// switches protocols.
server.on('upgrade', (req, socket, head) => {
    const target = targetFor(req.url);
    const headers = cleanHeaders(req.headers);
    if (req.headers.upgrade) {
        headers.upgrade = req.headers.upgrade;
    }
    if (req.headers.connection) {
        headers.connection = req.headers.connection;
    }
    const backend = http.request({
        host: target.host,
        port: target.port,
        method: req.method,
        path: req.url,
        headers,
    });
    backend.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
        socket.write(
            `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`,
        );
        for (const [name, value] of Object.entries(proxyRes.headers)) {
            socket.write(`${name}: ${value}\r\n`);
        }
        socket.write('\r\n');
        if (proxyHead && proxyHead.length > 0) {
            socket.write(proxyHead);
        }
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
    });
    backend.on('error', (err) => {
        console.error(
            `[proxy] upgrade ${req.url} -> ${target.host}:${target.port} failed: ${err.message}`,
        );
        socket.destroy();
    });
    backend.end(head);
});

server.listen(LISTEN_PORT, () => {
    console.log(
        `[proxy] listening :${LISTEN_PORT}  (/app/* -> :8080, * -> :8000)`,
    );
});
