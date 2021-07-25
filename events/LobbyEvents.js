const Player = require('../domain/Player');
const LobbyCodeDTO = require('../domain/dto/response/LobbyCodeDTO');
const LobbyJoinDTO = require('../domain/dto/response/LobbyJoinDTO');
/**
 * Event handlers and logic for `create-lobby` and `lobby-code`
 * The goal of these lobby events is to allow a host to create a game and receive a new room id.
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
function createLobby(io, socket, aufGame) {
    socket.on('create-lobby', (createLobbyDTO) => {
        // Create room and assign host player to the room
        const roomID = aufGame.newGame();
        const host = new Player(socket.id, roomID, createLobbyDTO.nickname, createLobbyDTO.playercolor, createLobbyDTO.pwallet, null, true);
        aufGame.gameRoomsDict[roomID].host = host;
        aufGame.gameRoomsDict[roomID].addPlayer(host); 

        // Subscribe to the room events
        socket.join(roomID);

        // Add player information to the host socket
        socket.player = host;
        socket.player.isHost = true;

        // Send room ID back to host.
        io.in(roomID).emit('lobby-code', new LobbyCodeDTO(roomID));
    });
}

/**
 * Event handlers and logic for `join-lobby`
 * The goal of these join events is to allow a player to join a game room and receive a confirmation.
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
function joinLobby(io, socket, aufGame) {
    // on join lobby message event will call join lobby event handler
    socket.on('join-lobby', (joinLobbyDTO) => {
        const room = aufGame.gameRoomsDict[joinLobbyDTO.roomCode];
        if (room === undefined) {
            // TODO: Handle non-existent room after MVP is done.
            // eslint-disable-next-line no-console
            console.log(`Lobby ${joinLobbyDTO.roomCode} doesn't exist`);
            return;
        }

        const player = new Player(socket.id, joinLobbyDTO.roomCode, joinLobbyDTO.nickname, joinLobbyDTO.playercolor, joinLobbyDTO.pwallet, null, false);
        room.addPlayer(player);
        socket.player = player;

        socket.join(player.roomID);

        io.in(socket.player.roomID).emit('lobby-join', new LobbyJoinDTO( 
            room.players.map((player) => player.nickname),
            room.players.map((player) => player.pwallet)
            )); 
        if (room.players.length >= room.minPlayerCount) {
            io.to(room.host.socketID).emit('lobby-ready');   
        }
    });
}

/**
 * Event handlers and logic for `reset-lobby` and `reset-lobby-update`
 * The goal of these events is to allow the host to reset the lobby, as well
 * as to send the update to reset to all connected players.
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
function resetLobby(io, socket, aufGame) {
    socket.on('reset-lobby', () => {
        aufGame.resetGame(socket.player.roomID);

        // Emit "reset-lobby-update" to all players in room
        io.in(socket.player.roomID).emit('reset-lobby-update');
    });
}

/**
 * Event handlers and logic for all of the lobby-related event
 * Current namespaces: create-lobby, lobby-code, reset-lobby, reset-lobby-update
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
module.exports = function (io, socket, aufGame) {
    createLobby(io, socket, aufGame);
    resetLobby(io, socket, aufGame);
    joinLobby(io, socket, aufGame);
};
