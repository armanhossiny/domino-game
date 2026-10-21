const GroupsManager = require("../Base/Manager/GroupsManager");
const { fail, Code, ok } = require("../Utils/responses");
const FetchGroup = require("../Services/FetchGroup");

const ROLE_HIERARCHY = {
  OWNER: 4, // مالک
  ADMIN: 3, // مدیر
  CO_ADMIN: 2, // معاون
  MEMBER: 1 // عضو ساده
};

function extractOwnerId(owner) {
  return owner?.objectId || owner?.id || owner;
}

function getEffectiveRoles(group, userId) {
  if (!group || !userId) {
    return { isOwner: false, isAdmin: false, isCoAdmin: false };
  }

  const isParseObject = typeof group.get === "function";

  const owner = isParseObject ? group.get("owner") : group.owner;
  const admins = (isParseObject ? group.get("admins") : group.admins) || [];
  const coAdmins =
    (isParseObject ? group.get("co_admins") : group.co_admins) || [];
  const players =
    (isParseObject ? group.get("players") : group.co_admins) || [];

  const ownerId = extractOwnerId(owner);

  return {
    isOwner: ownerId === userId,
    isAdmin: admins.includes(userId),
    isCoAdmin: coAdmins.includes(userId),
    isMember: players.includes(userId)
  };
}

async function checkUserCanManageGroupOf(userId, group) {
  if (!group) {
    return fail(Code.GROUP_NOT_FOUND);
  }

  const { isOwner, isAdmin, isCoAdmin } = getEffectiveRoles(group, userId);

  if (!isOwner && !isAdmin && !isCoAdmin) {
    return fail(Code.ACCESS_DENIED);
  }

  return ok(Code.OK, { isOwner, isAdmin, isCoAdmin, group });
}

function getRoleRank(group, userId) {
  const roles = getEffectiveRoles(group, userId);
  if (roles.isOwner) {
    return ROLE_HIERARCHY.OWNER;
  }
  if (roles.isAdmin) {
    return ROLE_HIERARCHY.ADMIN;
  }
  if (roles.isCoAdmin) {
    return ROLE_HIERARCHY.CO_ADMIN;
  }
  if (roles.isMember || group.get("players")?.includes(userId)) {
    return ROLE_HIERARCHY.MEMBER;
  }
  return 0; // غیرعضو
}

async function kickPlayer(req) {
  const { user, params } = req;
  const { groupId, playerId: targetPlayerId } = params;

  // ۱. اعتبارسنجی پارامترهای ورودی
  if (!groupId || !targetPlayerId) {
    return fail(Code.MISSING_PARAMETERS);
  }

  // ۲. جلوگیری از کیک کردن خود
  if (user.id === targetPlayerId) {
    return fail(Code.CANNOT_KICK_SELF);
  }

  // ۳. دریافت گروه
  const group = await FetchGroup(groupId);
  if (!group) {
    return fail(Code.GROUP_NOT_FOUND);
  }

  // ۴. بررسی دسترسی اولیه (مالک/مدیر/معاون می‌توانند به اینجا برسند)
  const access = await checkUserCanManageGroupOf(user.id, group);
  if (!access.success) {
    return access;
  }

  // ۵. محاسبه رتبه نقش هر دو طرف
  const kickerRank = getRoleRank(group, user.id);
  const targetRank = getRoleRank(group, targetPlayerId);

  // ۶. بررسی سلسله‌مراتب: فقط نقش پایین‌تر قابل حذف است
  if (kickerRank <= targetRank) {
    // پیام خطای دقیق‌تر برای دیباگ بهتر
    if (targetRank === ROLE_HIERARCHY.OWNER) {
      return fail(Code.CANNOT_KICK_OWNER);
    }
    if (targetRank === ROLE_HIERARCHY.ADMIN) {
      return fail(Code.CANNOT_KICK_ADMIN);
    }
    if (targetRank === ROLE_HIERARCHY.CO_ADMIN) {
      return fail(Code.CANNOT_KICK_CO_ADMIN);
    }
    return fail(Code.INSUFFICIENT_RANK);
  }

  // ۷. بررسی عضو بودن هدف در گروه
  const players = group.get("players") || [];
  if (!players.includes(targetPlayerId)) {
    return fail(Code.TARGET_NOT_IN_GROUP);
  }

  // ۸. حذف از تمام لیست‌های مربوطه
  group.remove("players", targetPlayerId);

  const admins = group.get("admins") || [];
  if (admins.includes(targetPlayerId)) {
    group.remove("admins", targetPlayerId);
  }

  const coAdmins = group.get("co_admins") || [];
  if (coAdmins.includes(targetPlayerId)) {
    group.remove("co_admins", targetPlayerId);
  }

  // ۹. ذخیره تغییرات گروه
  await group.save(null, { useMasterKey: true });

  // ۱۰. پاک‌سازی موازی: رفرنس کاربر هدف + آپدیت کش
  await Promise.all([
    (async () => {
      try {
        const targetUser = await new Parse.Query(Parse.User).get(
          targetPlayerId,
          { useMasterKey: true }
        );
        targetUser.set("groupId", "");
        targetUser.set("enableGroup", false);
        await targetUser.save(null, { useMasterKey: true });
      } catch (e) {
        if (e.code !== Parse.Error.OBJECT_NOT_FOUND) {
          throw e;
        }
      }
    })(),
    GroupsManager.updateGroupCache(groupId, group)
  ]);

  return ok(Code.PLAYER_KICKED, { group: GroupsManager.buildGroupData(group) });
}

module.exports = {
  kickPlayer
};
