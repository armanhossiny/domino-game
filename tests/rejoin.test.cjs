const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

for (const [name, game, reason] of [
  ['missing game', null, 'GAME_NOT_FOUND'],
  ['missing player', { players: {} }, 'PLAYER_NOT_IN_GAME'],
  ['departed player', { players: { 'test-player': { isLeave: true } } }, 'PLAYER_ALREADY_LEFT']
]) {
  test(`rejoin rejection reports ${name} without throwing or logging payload`, async () => {
    const sent = [], logs = [];
    const module = { exports: {} };
    const file = path.join(root, 'src/Handler/GameHandler.js');
    const dependencies = {
      '../Base/Manager/PlayerManager': { getLastPlayerGame: async () => null },
      '../Network': { SendByPlayerId: async (id, event) => sent.push(event) },
      '../Strings': { MT_GAME_NOT_VALID: 'gameNotValid', S_GAME_NOT_VALID: 'invalid' },
      '../Utils/logger': { warn: event => logs.push(event) }
    };
    // Other imports are unused by the rejection paths under test.
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module, require: id => dependencies[id] || {}
    }, { filename: file });
    await module.exports.reJoinGame({ game, gameId: 'g', playerId: 'test-player', rid: 'request-1', token: 'private-token' });
    assert.equal(sent.length, 1);
    assert.equal(logs[0].reasonCode, reason);
    assert.equal(logs[0].rid, 'request-1');
    assert.equal(JSON.stringify(logs).includes('private-token'), false);
  });
}
