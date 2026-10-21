const Parse = require("parse/node");

const GroupClass = Parse.Object.extend("v1_groups");

async function FetchGroup(groupId) {
  try {
    return await GroupClass.createWithoutData(groupId).fetch({
      useMasterKey: true
    });
  } catch (e) {
    if (e.code === Parse.Error.OBJECT_NOT_FOUND) {
      return null;
    }
    throw e;
  }
}

module.exports = FetchGroup;
