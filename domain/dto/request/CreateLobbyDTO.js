class CreateLobbyDTO {
    constructor(nickname, playercolor, pwallet) {
        this.nickname = nickname;
        this.playercolor = playercolor;
        this.pwallet = pwallet;
    }
}

module.exports = CreateLobbyDTO;
