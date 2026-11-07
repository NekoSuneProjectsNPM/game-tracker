'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

function safePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') ||
      value.startsWith('/') || value.split('/').some(v => !v || v === '.' || v === '..') ||
      !/^[a-zA-Z0-9_./-]+$/.test(value)) throw new TypeError('Unsafe JSON data path');
  if (!value.endsWith('.json')) throw new TypeError('Only .json files are supported');
  return value;
}
function sourceConfig(source) {
  if (!source) return null;
  const { owner, repo, branch = 'main', directory } = source;
  for (const part of [owner, repo, branch]) {
    if (typeof part !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(part)) throw new TypeError('Invalid GitHub repository source');
  }
  if (typeof directory !== 'string' || !directory || directory.split('/').some(x => !x || x === '.' || x === '..') ||
      !/^[a-zA-Z0-9_/-]+$/.test(directory)) throw new TypeError('Invalid GitHub source directory');
  return { owner, repo, branch, directory };
}
function createDataStore({ gameId, cacheDir, bundledDir, github, githubToken, syncFiles, fetchImpl = globalThis.fetch } = {}) {
  if (typeof gameId !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(gameId)) throw new TypeError('Valid gameId required');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const source = sourceConfig(github);
  const whitelist = syncFiles === undefined ? null : new Set(syncFiles.map(safePath));
  if (syncFiles !== undefined && (!Array.isArray(syncFiles) || syncFiles.length === 0)) throw new TypeError('syncFiles must be a nonempty array of JSON paths');
  if (githubToken !== undefined && (typeof githubToken !== 'string' || !githubToken.trim())) throw new TypeError('githubToken must be a nonempty string');
  const githubHeaders = { Accept: 'application/vnd.github+json', 'User-Agent': 'NekoSune-Game-Tracker', ...(githubToken ? { Authorization: 'Bearer ' + githubToken } : {}) };
  const cache = path.resolve(cacheDir || path.join(os.homedir(), '.cache', 'nekosune-game-tracker', gameId));
  const bundled = bundledDir ? path.resolve(bundledDir) : null;
  const manifestFile = path.join(cache, '.manifest.json');
  async function loadManifest() {
    try {
      const current = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
      if (current.source !== JSON.stringify({source, files: syncFiles || null}) || !current.files || typeof current.files !== 'object') return {};
      return current.files;
    } catch (err) { if (err.code === 'ENOENT' || err instanceof SyntaxError) return {}; throw err; }
  }
  async function atomicWrite(file, content) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.' + process.pid + '.' + require('node:crypto').randomBytes(6).toString('hex') + '.tmp';
    try { await fs.writeFile(tmp, content); await fs.rename(tmp, file); }
    catch (err) { await fs.rm(tmp, { force: true }); throw err; }
  }
  async function get(file) {
    const relative = safePath(file);
    for (const base of [cache, bundled].filter(Boolean)) {
      try { return JSON.parse(await fs.readFile(path.join(base, relative), 'utf8')); }
      catch (err) { if (err.code !== 'ENOENT') throw err; }
    }
    throw Object.assign(new Error('Local JSON not found: ' + relative), { code: 'ENOENT' });
  }
  async function list() {
    const results = new Set();
    async function walk(dir, relative = '') {
      let entries;
      try { entries = await fs.readdir(dir, { withFileTypes: true }); }
      catch (err) { if (err.code === 'ENOENT') return; throw err; }
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const rel = relative ? relative + '/' + entry.name : entry.name;
        if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
        else if (entry.isFile() && rel.endsWith('.json') && rel !== '.manifest.json') {
          try { safePath(rel); results.add(rel); } catch {}
        }
      }
    }
    if (bundled) await walk(bundled);
    await walk(cache);
    return [...results].sort();
  }
  async function sync({ signal } = {}) {
    if (!source) throw new Error('No GitHub JSON source configured in this tracker branch');
    const { owner, repo, branch, directory } = source;
    const api = 'https://api.github.com/repos/' + owner + '/' + repo + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1';
    const request = await fetchImpl(api, { headers: githubHeaders, signal });
    if (!request.ok) throw new Error('GitHub tree request failed: HTTP ' + request.status);
    const tree = await request.json();
    if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('GitHub directory listing incomplete; refusing partial sync');
    const prefix = directory + '/';
    const files = tree.tree.filter(item => item.type === 'blob' && item.path.startsWith(prefix) && item.path.endsWith('.json') && (!whitelist || whitelist.has(item.path.slice(prefix.length))))
      .map(item => ({ name: safePath(item.path.slice(prefix.length)), sha: item.sha, size: item.size }));
    if (files.length > 5000) throw new Error('Too many JSON files');
    const old = await loadManifest();
    const next = { ...old };
    let updated = 0, unchanged = 0;
    for (const item of files) {
      if (!/^[0-9a-f]{40}$/.test(item.sha) || item.size > 5 * 1024 * 1024) throw new Error('Invalid or oversized GitHub JSON blob');
      const target = path.join(cache, item.name);
      if (old[item.name] === item.sha) {
        try { await fs.access(target); unchanged++; continue; } catch {}
      }
      // GitHub Git Blob API supports private repositories with a fine-grained read token.
      // Fetch by content SHA so the downloaded file matches the exact tree snapshot.
      const blobUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/git/blobs/' + item.sha;
      const response = await fetchImpl(blobUrl, { headers: githubHeaders, signal });
      if (!response.ok) throw new Error('GitHub JSON download failed (' + item.name + '): HTTP ' + response.status);
      const blob = await response.json();
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string')
        throw new Error('Unexpected GitHub blob encoding for ' + item.name);
      const buffer = Buffer.from(blob.content.replace(/\s/g, ''), 'base64');
      if (buffer.length > 5 * 1024 * 1024) throw new Error('JSON file too large');
      const gitHash = require('node:crypto').createHash('sha1').update('blob ' + buffer.length + '\0').update(buffer).digest('hex');
      if (gitHash !== item.sha) throw new Error('GitHub JSON checksum mismatch: ' + item.name);
      JSON.parse(buffer.toString('utf8'));
      await atomicWrite(target, buffer);
      next[item.name] = item.sha;
      updated++;
    }
    // Cache is additive: do not automatically delete removed upstream files or user files.
    await atomicWrite(manifestFile, JSON.stringify({ source: JSON.stringify({source, files: syncFiles || null}), files: next }, null, 2) + '\n');
    return { updated, unchanged, checked: files.length, cacheDir: cache };
  }
  return Object.freeze({ get, list, sync, cacheDir: cache });
}
module.exports = { createDataStore };
