#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, join, normalize } from 'node:path';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8787);
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const MAX_BODY = 15 * 1024 * 1024;

function json(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseCookie(setCookie = '') {
  const match = setCookie.match(/PHPSESSID=([^;]+)/i);
  return match ? match[1] : '';
}

function md5(input) {
  return createHash('md5').update(input).digest('hex');
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('请求体过大');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) {
    return json(res, 400, { success: false, message: '用户名或密码不能为空。' });
  }

  const form = new URLSearchParams();
  form.set('user_id', username);
  form.set('password', md5(password));

  const response = await fetch('https://www.xmoj.tech/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redirect: 'manual'
  });

  const text = await response.text();
  const setCookie = response.headers.get('set-cookie') || '';
  const sessionId = parseCookie(setCookie);

  if (!sessionId) {
    const maybeSuccess = text.includes('history.go(-2);');
    return json(res, 401, {
      success: false,
      message: maybeSuccess ? '登录结果无法解析，请重试。' : '用户名或密码错误。'
    });
  }

  return json(res, 200, {
    success: true,
    username,
    sessionId
  });
}

async function handleApiProxy(req, res, action) {
  const body = await readBody(req);
  const response = await fetch(`https://api.xmoj-bbs.me/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

async function serveStatic(req, res, pathname) {
  const clean = normalize(pathname).replace(/^\/+/, '');
  const file = clean === '' ? 'index.html' : clean;
  if (file.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const fullPath = join(ROOT, file);
  try {
    const data = await readFile(fullPath);
    const type = MIME[extname(fullPath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/__webui/health') {
      return json(res, 200, { success: true, mode: 'proxy' });
    }
    if (pathname === '/__webui/login' && req.method === 'POST') {
      return await handleLogin(req, res);
    }
    if (pathname.startsWith('/__webui/api/') && req.method === 'POST') {
      const action = pathname.substring('/__webui/api/'.length);
      if (!action) return json(res, 400, { success: false, message: '缺少 action' });
      return await handleApiProxy(req, res, action);
    }

    return await serveStatic(req, res, pathname);
  } catch (error) {
    return json(res, 500, { success: false, message: error.message || 'Internal error' });
  }
}).listen(PORT, HOST, () => {
  console.log(`[webui-proxy] http://${HOST}:${PORT}`);
});
