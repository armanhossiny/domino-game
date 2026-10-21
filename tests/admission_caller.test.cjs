const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('atomic caller retries a lost response with identical identifiers, legacy caller does not', async () => {
  const source = fs.readFileSync(path.join(root, 'src/Services/JoinMatchParse.js'), 'utf8');
  for (const enabled of [false, true]) {
    const calls = [], module = { exports: {} };
    vm.runInNewContext(source, { module, process: { env: { MATCH_ATOMIC_ADMISSION: enabled ? '1' : '0' } },
      require: name => {
        if (name === '../Utils') return { logger: { error() {} } };
        if (name === 'parse/node') return { Cloud: { run: async (name, input) => {
          calls.push(input);
          if (calls.length === 1) throw Error('response lost');
          return { success: true, objectId: 'match1' };
        } } };
        throw Error(name);
      }
    });
    const input = { gameId: 'game1', admissionId: 'lobby1' };
    const result = await module.exports(input);
    assert.equal(calls.length, enabled ? 2 : 1);
    assert.ok(calls.every(value => value === input));
    assert.equal(result?.success, enabled ? true : undefined);
  }
});


test('game rejects null, failed and malformed success responses before initialization', async () => {
  const source = fs.readFileSync(path.join(root, 'src/Handler/MatchHandler.js'), 'utf8');
  const body = source.slice(source.indexOf('async function onMatchStart('), source.indexOf('async function isAllPlayerExist('));
  for (const result of [undefined, { success: false }, { success: true }, { success: 'true', objectId: 'm' }]) {
    const calls = [];
    const run = vm.runInNewContext(body + '\nonMatchStart', {
      GameHandler: { setupGame: async () => ({ gameId: 'g' }) },
      getGamePlayerIds: async () => ['u0', 'u1'], joinMatchParse: async () => result,
      leaveMatchHandler: async p => { calls.push(p.playerId); if (p.playerId === 'u0') throw Error('cleanup'); },
      GameManager: { add: async () => calls.push('START') },
      ValidationError: Error, logger: { error() {} }
    });
    await run({ matchId: 'm' }, { maxPlayer: 2, coin_entry: 10, key: 'draw' });
    assert.deepEqual(calls, ['u0', 'u1']);
  }
});


