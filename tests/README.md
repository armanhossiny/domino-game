# Game tests

From this repository root, run `npm.cmd test` (or `npm test` on Linux).

All 11 tests load this repository's code with injected Parse/Redis/network
boundaries. They cover admission response handling, activation order, late state
updates, rejoin errors and internal caller authorization. No sibling checkout,
credentials or running services are required. Real Redis/Parse process-failure
and reconnect tests remain necessary before deployment.
