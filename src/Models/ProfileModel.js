class ProfileModel {
  constructor(obj = {}) {
    const {
      playerId = undefined,
      name = "Unknown",
      avatar = "default",
      avatarFrame = "default",
      level = 1,
      selectedEmoji = "default",
      selectedItem = "default",
      selectedCrown = "default",
      selectedDomino = "default",
      isVip = false
    } = obj;

    this.playerId = playerId;
    this.name = name;
    this.avatar = avatar;
    this.avatarFrame = avatarFrame;
    this.level = level;
    this.selectedEmoji = selectedEmoji;
    this.selectedItem = selectedItem;
    this.selectedCrown = selectedCrown;
    this.selectedDomino = selectedDomino;
    this.isVip = isVip;
  }
}

module.exports = ProfileModel;
