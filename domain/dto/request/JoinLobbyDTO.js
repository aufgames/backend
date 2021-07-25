class JoinLobbyDTO {
    constructor(nickname, playercolor, pwallet, roomCode) {
        this.nickname = nickname;
        this.playercolor = playercolor;
        this.pwallet = pwallet;
        this.roomCode = roomCode;
    }
}

module.exports = JoinLobbyDTO;
