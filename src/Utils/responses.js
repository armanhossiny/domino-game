// ──────────────────────────────────────────────────────────────────────────────
// Response codes & builders
// ──────────────────────────────────────────────────────────────────────────────


const ErrorCode = Object.freeze({
  // ── Group ──
  GROUP_NOT_FOUND:                          "GROUP_NOT_FOUND",
  GROUP_ID_IS_NULL:                         "GROUP_ID_IS_NULL",
  GROUP_ID_REQUIRED:                        "GROUP_ID_REQUIRED",
  GROUP_IS_FULL:                            "GROUP_IS_FULL",
  MAX_CAPACITY_REACHED:                     "MAX_CAPACITY_REACHED",

  // ── Display name ──
  DISPLAY_NAME_IS_REQUIRED:                 "DISPLAY_NAME_IS_REQUIRED",
  DISPLAY_NAME_ALREADY_EXISTS:              "DISPLAY_NAME_ALREADY_EXISTS",

  // ── User / membership state ──
  INVALID_USER:                             "INVALID_USER",
  JOIN_REQUEST_EXISTS:                      "JOIN_REQUEST_EXISTS",
  UNAUTHORIZED:                             "UNAUTHORIZED",
  USER_HAS_GROUP:                           "USER_HAS_GROUP",
  USER_HAVE_NOT_GROUP:                      "USER_HAVE_NOT_GROUP",
  PLAYER_NOT_FOUND:                         "PLAYER_NOT_FOUND",
  ALREADY_IN_GROUP:                         "ALREADY_IN_GROUP",
  ALREADY_IN_ANOTHER_GROUP:                 "ALREADY_IN_ANOTHER_GROUP",
  PLAYER_ALREADY_IN_A_GROUP:                "PLAYER_ALREADY_IN_A_GROUP",
  PLAYER_ALREADY_IN_GROUP:                  "PLAYER_ALREADY_IN_GROUP",
  PLAYER_NOT_IN_GROUP:                      "PLAYER_NOT_IN_GROUP",
  TARGET_NOT_IN_GROUP:                      "TARGET_NOT_IN_GROUP",

  // ── Permissions / roles ──
  ACCESS_DENIED:                            "ACCESS_DENIED",
  PERMISSION_DENIED:                        "PERMISSION_DENIED",
  ONLY_OWNER_CAN_DELETE:                    "ONLY_OWNER_CAN_DELETE",
  ONLY_OWNER_CAN_UPGRADE:                   "ONLY_OWNER_CAN_UPGRADE",
  INSUFFICIENT_RANK:                        "INSUFFICIENT_RANK",
  CANNOT_KICK_SELF:                         "CANNOT_KICK_SELF",
  CANNOT_KICK_CO_ADMIN:                     "CANNOT_KICK_CO_ADMIN",
  CANNOT_KICK_ADMIN:                        "CANNOT_KICK_ADMIN",
  CANNOT_KICK_OWNER:                        "CANNOT_KICK_OWNER",
  CANNOT_CHANGE_OWNER_ROLE:                 "CANNOT_CHANGE_OWNER_ROLE",
  INVALID_ROLE:                             "INVALID_ROLE",
  ROLE_MISMATCH_RETRY:                      "ROLE_MISMATCH_RETRY",
  ALREADY_ADMIN:                            "ALREADY_ADMIN",
  ALREADY_CO_ADMIN:                         "ALREADY_CO_ADMIN",
  ALREADY_MEMBER:                           "ALREADY_MEMBER",
  MEMBERS_UPDATE_FAILED:                    "MEMBERS_UPDATE_FAILED",

  // ── Join requests (player → group) ──
  JOIN_REQUEST_NOT_FOUND:                   "JOIN_REQUEST_NOT_FOUND",
  JOIN_REQUEST_ALREADY_SENT:                "JOIN_REQUEST_ALREADY_SENT",
  JOIN_REQUEST_STALE_PLAYER_IN_ANOTHER_GROUP: "JOIN_REQUEST_STALE_PLAYER_IN_ANOTHER_GROUP",

  // ── Invites (group → player) ──
  INVITE_NOT_FOUND:                         "INVITE_NOT_FOUND",
  INVITE_ALREADY_SENT:                      "INVITE_ALREADY_SENT",
  INVITE_PENDING_ACCEPT_OR_DECLINE:         "INVITE_PENDING_ACCEPT_OR_DECLINE",
  PENDING_RELATIONSHIP_EXISTS:              "PENDING_RELATIONSHIP_EXISTS",

  // ── Economy ──
  COINS_NOT_ENOUGH:                         "COINS_NOT_ENOUGH",
  GEM_NOT_ENOUGH:                           "GEM_NOT_ENOUGH",

  // ── Search ──
  SEARCH_NAME_REQUIRED:                     "SEARCH_NAME_REQUIRED",
  SEARCH_NAME_TOO_LONG:                     "SEARCH_NAME_TOO_LONG",
  SEARCH_NAME_TOO_SHORT:                    "SEARCH_NAME_TOO_SHORT",

  // ── Generic ──
  INTERNAL_ERROR:                           "INTERNAL_ERROR",
  MISSING_PARAMETERS:                       "MISSING_PARAMETERS",
  PAGINATION_CACHE_EXPIRED_RETRY_FROM_PAGE_1: "PAGINATION_CACHE_EXPIRED_RETRY_FROM_PAGE_1",
});


// ──────────────────────────────────────────────────────────────────────────────
// Success codes — for operations that actually succeeded.
// ──────────────────────────────────────────────────────────────────────────────

const SuccessCode = Object.freeze({
  // ── Group ──

  INVALID_CURRENCY_TYPE:      "INVALID_CURRENCY_TYPE",
  INVALID_CREATE_GROUP:       "INVALID_CREATE_GROUP",
  GET_GROUPS:                 "GET_GROUPS",
  GET_GROUP:                  "GET_GROUP",
  REQUEST_CREATE:             "REQUEST_CREATE",
  REQUEST_UPDATE:             "REQUEST_UPDATE",
  GROUP_DELETED_SUCCESSFULLY: "GROUP_DELETED_SUCCESSFULLY",
  GROUP_CAPACITY_UPGRADED:    "GROUP_CAPACITY_UPGRADED",
  PLAYER_KICKED:              "PLAYER_KICKED",
  GROUP_JOINED:               "GROUP_JOINED",
  GROUP_LEFT:                 "GROUP_LEFT",

  // ── Join requests ──
  JOIN_REQUEST_SENT:      "JOIN_REQUEST_SENT",
  JOIN_REQUEST_ACCEPTED:  "JOIN_REQUEST_ACCEPTED",
  JOIN_REQUEST_REJECTED:  "JOIN_REQUEST_REJECTED",
  JOIN_REQUEST_CANCELLED: "JOIN_REQUEST_CANCELLED",

  // ── Invites ──
  INVITE_SENT:     "INVITE_SENT",
  INVITE_ACCEPTED: "INVITE_ACCEPTED",
  INVITE_DECLINED: "INVITE_DECLINED",

  // ── Search ──
  SEARCH_GROUP_BY_NAME:   "SEARCH_GROUP_BY_NAME",
  SEARCH_GROUP_BY_FILTER: "SEARCH_GROUP_BY_FILTER",

  // ── Economy ──
  ITEM_PURCHASE_SUCCESS: "ITEM_PURCHASE_SUCCESS", // ← typo فیکس (PERCHESS → PURCHASE)

  // ── Generic ──
  OK: "OK",
});


// ──────────────────────────────────────────────────────────────────────────────
// Success codes without data — pre-built as `S.*` for one-line returns.
// ──────────────────────────────────────────────────────────────────────────────

const SIMPLE_SUCCESS_CODES = Object.freeze({
  GROUP_DELETED_SUCCESSFULLY: SuccessCode.GROUP_DELETED_SUCCESSFULLY,
  JOIN_REQUEST_SENT:          SuccessCode.JOIN_REQUEST_SENT,
  JOIN_REQUEST_REJECTED:      SuccessCode.JOIN_REQUEST_REJECTED,
  JOIN_REQUEST_CANCELLED:     SuccessCode.JOIN_REQUEST_CANCELLED,
  INVITE_SENT:                SuccessCode.INVITE_SENT,
  INVITE_DECLINED:            SuccessCode.INVITE_DECLINED,
  ITEM_PURCHASE_SUCCESS:      SuccessCode.ITEM_PURCHASE_SUCCESS,
});


// ──────────────────────────────────────────────────────────────────────────────
// Builders
// ──────────────────────────────────────────────────────────────────────────────

const fail = (code, data) =>
  Object.freeze({ success: false, message: code, data: data ?? {} });

const ok = (code, data) =>
  Object.freeze({ success: true, message: code, data: data ?? {} });


// ──────────────────────────────────────────────────────────────────────────────
// Pre-built maps (auto-generated)
// ──────────────────────────────────────────────────────────────────────────────

// `R.GROUP_NOT_FOUND` ← معادل `fail(ErrorCode.GROUP_NOT_FOUND)` ولی کوتاه‌تر.
const R = Object.freeze(
  Object.fromEntries(
    Object.entries(ErrorCode).map(([key, code]) => [key, fail(code)])
  )
);

// `S.JOIN_REQUEST_REJECTED` ← معادل `ok(SuccessCode.JOIN_REQUEST_REJECTED)` ولی کوتاه‌تر.
const S = Object.freeze(
  Object.fromEntries(
    Object.entries(SIMPLE_SUCCESS_CODES).map(([key, code]) => [key, ok(code)])
  )
);


const _duplicateKeys = Object.keys(ErrorCode).filter(key => key in SuccessCode);

if (_duplicateKeys.length > 0) {
  throw new Error(`ErrorCode/SuccessCode key collision: ${_duplicateKeys.join(", ")}`);
}

const Code = Object.freeze({ ...ErrorCode, ...SuccessCode });


// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
  ErrorCode,
  SuccessCode,
  Code,
  R,
  S,
  fail,
  ok,
};
