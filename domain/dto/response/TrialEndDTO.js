class TrialEndDTO {
    constructor(playerKilled, isGameOver, nicknameKilled) {
        this.playerKilled = playerKilled;
        this.isGameOver = isGameOver;
        this.nicknameKilled = nicknameKilled;
    }
}

module.exports = TrialEndDTO;
