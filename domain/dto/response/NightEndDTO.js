class NightEndDTO {
    constructor(playerKilled, isGameOver, usernameKilled) {
        this.playerKilled = playerKilled;
        this.isGameOver = isGameOver;
        this.usernameKilled = usernameKilled;
    }
}

module.exports = NightEndDTO;
