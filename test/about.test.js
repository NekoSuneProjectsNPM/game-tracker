'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Warframe = require('../index');

test('About reads real bundled Warframe meta.json with platform metadata', async () => {
  const warframeData=Warframe({ fetchImpl: async()=>{ throw Error('network should not be used'); } });
  const about=await warframeData.About();
  assert.equal(about.name,'Warframe');
  assert.ok(about.Platform.includes('Windows'));
  assert.equal(about.developers,'Digital Extremes');
});
