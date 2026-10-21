const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('internal game callers include master authorization', async () => {
  for (const name of ['UpdateUserEmojiCounterParse', 'UpdateUserStickerCounterParse', 'ReportPlayerParse']) {
    const module = { exports: {} }, calls = [];
    vm.runInNewContext(fs.readFileSync(path.join(root, `src/Services/${name}.js`), 'utf8'), {
      module, require: key => key === 'parse/node' ? { Cloud: { run: async (...args) => calls.push(args) } }
        : { logger: { error() {} } }
    });
    await module.exports({ userId: 'synthetic-user' });
    assert.equal(calls[0][2].useMasterKey, true, name);
  }
});

for (const [fileName, endpoint] of [['JoinMatchParse', 'join-match'], ['EndGameParse', 'end-match']]) {
  test(`${fileName} explicitly requests master authorization`, async () => {
    const module = { exports: {} }, calls = [];
    const expected = { success: true };
    const file = path.join(root, `src/Services/${fileName}.js`);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module,
      process: { env: {} },
      require: name => {
        if (name === 'parse/node') return { Cloud: { run: async (...args) => { calls.push(args); return expected; } } };
        if (name === '../Utils') return { logger: { info() {}, error() {} } };
        throw Error(name);
      }
    }, { filename: file });
    const data = { matchId: 'synthetic-match' };
    assert.equal(await module.exports(data), expected);
    assert.equal(calls[0][0], endpoint);
    assert.equal(calls[0][1], data);
    assert.equal(calls[0][2].useMasterKey, true);
  });
}
