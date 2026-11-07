'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),VRChat=require('../index');
test('offline bundled metadata and categories',async()=>{
  const v=VRChat({fetchImpl:async()=>{throw Error('unexpected request')}});
  assert.equal((await v.About()).name,'VRChat');
  assert.equal((await v.players.list()).length,17);
  assert.equal((await v.groups.list()).length,14);
  assert.equal((await v.worlds.list()).length,22);
  assert.deepEqual(await v.avatars.list(),[]);
});
test('lookup and search original full JSON',async()=>{
  const v=VRChat();
  assert.equal((await v.player('nekosunevr',{refresh:false})).name,'NekoSuneVR');
  assert.equal((await v.group('nekosunecommunity',{refresh:false})).name,'NekoSune Community');
  assert.equal((await v.world('theblackcat',{refresh:false})).name,'The Black Cat');
  assert.ok((await v.worlds.search('Black Cat')).total>=1);
});
test('bad record categories and path traversal rejected',async()=>{
  const v=VRChat();
  await assert.rejects(v.avatar('notexisting',{refresh:false}),{code:'NOT_FOUND'});
  await assert.rejects(v.record('private','anything'),RangeError);
  await assert.rejects(v.data.get('../package.json'),TypeError);
});
