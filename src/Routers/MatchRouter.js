const { MatchHandler } = require("../Handler");
const Router = require("../Utils/CustomRouter");
const { playerMiddleware, matchMiddleware } = require("../MiddleWares");
const { needPlayerExist } = playerMiddleware;
const {
  isCreateGameEnabled,
  JoinMatchErrorHandler,
  isTableExist,
  isPlayerProfileExist,
  isNotPlayerBanned,
  isPlayerEarlyInGame,
  checkPlayerEarlyInThisMatch,
  checkOrder
} = matchMiddleware;

const {
  removePlayerInMatch,
  completeMatch,
  inviteToMatch,
  inviteFriendsToMatch,
  inviteRematch,
  acceptJoinMatch,
  reInvitePlayerToMatch,
  inviteFriendToMatch,
  declineJoinMatch,
  deleteFromMatch,
  leaveMatchHandler,
  joinMatch
} = MatchHandler;

Router.handle("removePlayerInMatch", [], removePlayerInMatch);
Router.handle("create_match_system", [], completeMatch);

[
  ["joinMatch", JoinMatchErrorHandler(joinMatch)],
  ["joinClubMatch", JoinMatchErrorHandler(joinMatch)],
  ["acceptJoinMatch", JoinMatchErrorHandler(acceptJoinMatch)],
  ["inviteRematch", inviteRematch],
  ["inviteFriendsToMatch", inviteFriendsToMatch],
  ["invitePlayerToMatch", inviteFriendToMatch]
].forEach(([event, handler]) => {
  Router.handle(
    event,
    [
      isCreateGameEnabled,
      needPlayerExist,
      isTableExist,
      isPlayerProfileExist,
      isNotPlayerBanned,
      isPlayerEarlyInGame,
      checkOrder,
      checkPlayerEarlyInThisMatch
    ],
    handler
  );
});
// Router.handle("acceptJoinMatch", [], reInvitePlayerToMatch);

[
  ["inviteToMatch", inviteToMatch],
  ["declineJoinMatch", declineJoinMatch],
  ["deleteFromMatch", deleteFromMatch],
  ["leaveMatch", leaveMatchHandler]
].forEach(([event, handler]) => {
  Router.handle(event, [needPlayerExist], handler);
});
