const config = require('../../config.json');
const loadLobbyEvents = require('../../events/LobbyEvents');
const loadVoteEvents = require('../../events/VoteEvents');
const loadGameStartEvents = require('../../events/GameStartEvents');
const { loadNightTimeEvents } = require('../../events/NightTimeVoteEvents');
const loadStateChangeEvents = require('../../events/game-state-events/StateChangeEvents');

const AUFGame = require('../../domain/AUFGame');
const Room = require('../../domain/Room');
const Player = require('../../domain/Player');

const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: config.cors_origin,
    },
});

let aufGame = null;
let testPlayerSocket;

/**
 * This is a mock of a AUFGame, which will help us write unit tests without setting up the AUFGame itself.
 * It will create a new game with a new room, and open a websocket server over Express.
 * Room elements will be useful elements that unit tests can access to, e.g. the random roomID created for the mock AUFGame.
 */
function createAUFGameWithOnePlayerMock(port) {
    aufGame = new AUFGame();
    const roomID = aufGame.newGame();
    aufGame.gameRoomsDict[roomID] = new Room();
    const hostPlayer = new Player(null, roomID, 'impostorPlayer', 'red', 'impostor', true);
    addPlayer(hostPlayer, roomID);

    io.on('connection', (socket) => {
        loadLobbyEvents(io, socket, aufGame);
        loadVoteEvents(io, socket, aufGame);
        loadGameStartEvents(io, socket, aufGame);
        loadNightTimeEvents(io, socket, aufGame);
        loadStateChangeEvents(io, socket, aufGame);
        socket.player = hostPlayer;
        testPlayerSocket = socket;
        socket.join(roomID);
    });

    beforeAll((done) => {
        server.listen(port, () => {
            done();
        });
    });

    return { io, aufGame, socketIOServer: server, roomID, hostPlayer };
}

function addPlayer(player, roomID) {
    let room = aufGame.gameRoomsDict[roomID];

    room.addPlayer(player);
}

function addPlayers(players, roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    for (let player of players) {
        room.addPlayer(player);
    }
}

function getHostPlayer(roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    return room.players[0];
}

function addImpostorVote(voter, votedFor, roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    const { impostorVoteMap } = room.voteHandler;

    impostorVoteMap[voter.nickname] = votedFor;
}

function addDayVote(voter, votedFor, roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    const { daytimeVoteMap } = room.voteHandler;

    daytimeVoteMap[voter.nickname] = votedFor;
}

function addTrialVote(voter, votedFor, roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    const { trialVoteMap } = room.voteHandler;

    trialVoteMap[voter.nickname] = votedFor;
}

/**
 * Switch the current player (socket.player)
 * @param {*} nickname
 * @param {*} roomID
 */
function switchPlayer(nickname, roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    testPlayerSocket.player = room.getPlayerByNickname(nickname);
}

function resetRoom(roomID) {
    const room = aufGame.gameRoomsDict[roomID];
    room.resetGame();
    room.players = [];
    room.host = null;
    room.voteHandler.resetVotes();

    const hostPlayer = new Player(null, roomID, 'impostorPlayer', 'red', 'impostor', true);
    addPlayer(hostPlayer, roomID);
}

module.exports = {
    createAUFGameWithOnePlayerMock,
    addPlayer,
    addPlayers,
    getHostPlayer,
    addImpostorVote,
    addDayVote,
    addTrialVote,
    switchPlayer,
    resetRoom,
};
