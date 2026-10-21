const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('game persists pending state before activation and never notifies players on failed persistence', async () => {
  const source = fs.readFileSync(path.join(root, 'src/Handler/MatchHandler.js'), 'utf8');
  const body = source.slice(source.indexOf('async function onMatchStart('), source.indexOf('async function isAllPlayerExist('));
  for (const failure of ['storage', 'activation', null]) {
    const events = [];
    const game = { gameId: 'g', state: {} };
    const fn = vm.runInNewContext(body + '\nonMatchStart', {
      GameHandler: { setupGame: async () => game }, getGamePlayerIds: async () => ['u0', 'u1'],
      joinMatchParse: async data => { assert.equal(data.activationProtocol, 1); return { success: true, objectId: 'm', activationRequired: true }; },
      GameManager: { set: async () => { events.push('persist'); assert.equal(game.state.admissionPending, true); if (failure === 'storage') throw Error('storage'); },
        add: async () => assert.fail('unconfirmed game registered') },
      require: name => { assert.equal(name, './AdmissionActivation'); return async () => {
        events.push('activate'); if (failure === 'activation') throw Error('activation'); return true;
      }; },
      InitGameCommand: class {}, Conductor: { run: async () => events.push('notify') }, logger: { error() {} }
    });
    await fn({ matchId: 'lobby1' }, { maxPlayer: 2, coin_entry: 10, key: 'draw' });
    assert.deepEqual(events, failure === 'storage' ? ['persist'] : failure === 'activation' ? ['persist', 'activate'] : ['persist', 'activate', 'notify']);
  }
});

test('activation handler refuses ambiguous replies and finalizes only confirmed or refunded states', async () => {
  const source = fs.readFileSync(path.join(root, 'src/Handler/AdmissionActivation.js'), 'utf8');
  for (const result of [undefined, { success: false }, { success: true, state: 'active' }, { success: false, state: 'refunded' }]) {
    const calls = [], module = { exports: {} };
    vm.runInNewContext(source, { module, require: name => name.includes('ActivateMatchParse') ? async () => result : {
      finalizeAdmission: async (id, objectId, refunded) => { calls.push(refunded); return { state: { admissionPending: refunded, isEnded: refunded } }; }
    } });
    const game = { gameId: 'g', objectId: 'm', state: { admissionPending: true } };
    if (!result?.state) {
      await assert.rejects(module.exports(game), /UNCONFIRMED/);
      assert.equal(calls.length, 0);
    } else {
      assert.equal(await module.exports(game), result.state === 'active');
      assert.deepEqual(calls, [result.state === 'refunded']);
    }
  }
});

test('game admission finalization retries concurrent state change and never restores an old board', async () => {
  const source = fs.readFileSync(path.join(root, 'src/Base/Manager/GameManager.js'), 'utf8');
  let current = { gameId: 'g', objectId: 'm', state: { admissionPending: true }, moves: [] };
  let writes = 0, registrations = 0;
  const module = { exports: {} };
  const deps = {
    '../../Utils/redis': { get: async () => JSON.stringify(current), eval: async () => {
      writes++;
      current = { ...current, state: { admissionPending: false }, moves: ['newer'] };
      return 0;
    } }, '../../Rules': obj => obj, '../../Utils': {}, '../../Consts': { RedisKeys: { ALL_GAMES: 'games' } },
    '../../Core': { addGame: async () => registrations++ }
  };
  vm.runInNewContext(source, { module, global: { process }, require: name => deps[name] });
  const result = await module.exports.finalizeAdmission('g', 'm', false);
  assert.deepEqual(JSON.parse(JSON.stringify(result.moves)), ['newer']);
  assert.equal(writes, 1);
  assert.equal(registrations, 1);
});
