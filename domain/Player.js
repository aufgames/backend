const PlayerStatus = require('./enum/PlayerStatus');

/**
 * Represents a player in a game of AUF.
 * A player is part of a room, and they are tied to a socket that is connected to the server.
 * Players are identified by a unique nickname within their room.
 */
class Player {
    constructor(socketID, roomID, nickname, playercolor, pwallet, role, isHost) {
        this.socketID = socketID;
        this.roomID = roomID;
        this.nickname = nickname;
        this.playercolor = playercolor;
        this.pwallet = pwallet;
        this.role = role;
        this.status = PlayerStatus.ALIVE;
        this.isHost = isHost;
    }

    /**
     * Resets the state of a player by bringing them back to life with a 'null' role.
     */
    resetPlayer() {
        this.role = null;
        this.status = PlayerStatus.ALIVE;
    }
}

module.exports = Player;
