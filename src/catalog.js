'use strict';

// Common reusable JSON discovery across any game or category.
const path = require('node:path');

const normalise = value => String(value ?? '').trim().normalize('NFKC').toLowerCase().replace(/[\s_-]+/g, ' ');
const slug = value => normalise(value).replace(/[^a-z0-9 ]/g, '').replace(/ +/g, '');

function descriptor(file, record) {
  const type = file.split('/')[0] || 'data';
  const id = path.posix.basename(file, '.json');
  const name = typeof record?.name === 'string' ? record.name :
    typeof record?.title === 'string' ? record.title : id.replace(/[-_]/g, ' ');
  return { id: String(record?.id || id), name, type, path: file };
}
function valuesFrom(record, limit = 10000) {
  const values = [];
  const stack = [record];
  while (stack.length && values.length < limit) {
    const value = stack.pop();
    if (typeof value === 'string' || typeof value === 'number') values.push(String(value));
    else if (Array.isArray(value)) stack.push(...value.slice(0,1000));
    else if (value && typeof value === 'object') stack.push(...Object.values(value).slice(0,1000));
  }
  return values;
}
function createCatalog(data) {
  if (!data || typeof data.list !== 'function' || typeof data.get !== 'function')
    throw new TypeError('A JSON data store is required');

  async function all(category) {
    const files = await data.list();
    const prefix = category ? category + '/' : '';
    const matches = [];
    for (const file of files) {
      if (!file.endsWith('.json') || (category && !file.startsWith(prefix))) continue;
      try {
        const record = await data.get(file);
        matches.push({ ...descriptor(file, record), record });
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
    }
    return matches;
  }

  async function search(query, { category, limit = 50 } = {}) {
    if (typeof query !== 'string' || !query.trim()) throw new TypeError('Search query is required');
    if (category && !/^[a-z0-9_-]+$/.test(category)) throw new TypeError('Invalid category');
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new RangeError('limit must be between 1 and 500');
    const needle = normalise(query);
    const results = [];
    for (const item of await all(category)) {
      const shortFields = [item.id, item.name, item.path, item.record?.title, ...(Array.isArray(item.record?.aliases) ? item.record.aliases : [])];
      const direct = shortFields.some(v => v != null && normalise(v).includes(needle));
      const content = !direct && valuesFrom(item.record).some(v => normalise(v).includes(needle));
      if (!direct && !content) continue;
      const score = normalise(item.name) === needle || normalise(item.id) === needle || slug(item.name) === slug(query) ? 0 :
        direct ? 1 : 2;
      results.push({ id:item.id, name:item.name, type:item.type, path:item.path, score });
    }
    results.sort((a,b) => a.score-b.score || a.name.localeCompare(b.name) || a.path.localeCompare(b.path));
    const found = results.slice(0,limit).map(({score,...result})=>result);
    return {
      query,
      total: results.length,
      results: found,
      message: results.length ? `Found ${results.length} result(s) for "${query}".` : `We don't have anything related to "${query}".`
    };
  }

  async function get(category, idOrName) {
    if (typeof category !== 'string' || !/^[a-z0-9_-]+$/.test(category))
      throw new TypeError('Invalid category');
    if (typeof idOrName !== 'string' || !idOrName.trim()) throw new TypeError('Record name or ID is required');
    const needle = normalise(idOrName);
    const matches = (await all(category)).filter(item =>
      normalise(item.id) === needle || normalise(item.name) === needle ||
      slug(item.id) === slug(idOrName) || slug(item.name) === slug(idOrName) ||
      normalise(item.path) === needle);
    if (!matches.length) {
      const error = new Error(`We don't have anything related to "${idOrName}" in ${category}.`);
      error.code = 'NOT_FOUND';
      throw error;
    }
    if (matches.length > 1) {
      const error = new Error(`Multiple ${category} records match "${idOrName}". Select an exact result path.`);
      error.code = 'AMBIGUOUS';
      error.results = matches.map(({record,...info})=>info);
      throw error;
    }
    return matches[0].record;
  }

  return Object.freeze({
    search,
    get,
    character: id => get('characters', id),
    item: id => get('items', id),
    code: id => get('codes', id),
    map: id => get('maps', id)
  });
}
module.exports = { createCatalog };
