const Client = require('socket.io-client');
const AUFGameMock = require('../mocks/AUFGameMock');
const config = require('../../config.json');
const Player = require('../../domain/Player');
const roles = require('../../domain/enum/Role');
const VoteType = require('../../common/enum/Vote');

describe('trial-start unit tests', () => {
    const port = process.env.PORT || config.local_port;
    const roomElements = AUFGameMock.createAUFGameWithOnePlayerMock(port);

    // Create a new client, and connect it to the server via a socket
    let clientSocket;
    beforeEach((done) => {
        clientSocket = new Client(`http://localhost:${port}`);
        clientSocket.on('connect', done);
    });

    // Disconnect each socket connected to the server
    afterEach((done) => {
        const { sockets } = roomElements.io.sockets;
        sockets.forEach((socket) => {
            socket.disconnect(true);
        });

        AUFGameMock.resetRoom(roomElements.roomID);

        done();
    });

    // Close the server once all tests are done
    afterAll(() => {
        roomElements.socketIOServer.close();
    });

    test('trial-start successful call, no votes, winning condition is not fulfilled', (done) => {
        const playerA = new Player(null, null, 'a', 'red', roles.IMPOSTOR, true);
        const playerB = new Player(null, null, 'b', 'red', roles.JESTER, true);
        const playerC = new Player(null, null, 'c', 'red', roles.CREWMATE, true);
        const playerD = new Player(null, null, 'd', 'red', roles.CREWMATE, true);

        // total 5 players: mock initialised with host player which is impostor
        AUFGameMock.addPlayer(playerA, roomElements.roomID);
        AUFGameMock.addPlayer(playerB, roomElements.roomID);
        AUFGameMock.addPlayer(playerC, roomElements.roomID);
        AUFGameMock.addPlayer(playerD, roomElements.roomID);

        // Register mock event handlers for the events that the backend emits - assertions for the DTOs
        clientSocket.on('trial-start', (trialStartDTO) => {
            expect(trialStartDTO.timeToVote).toBe(config.trial_total_vote_time_in_milliseconds);
        });
        clientSocket.on('trial-end', (trialEndDTO) => {
            expect(trialEndDTO.playerKilled).toBe(VoteType.NoConfidenceVote);
            expect(trialEndDTO.isGameOver).toBe(false);
            done();
        });

        // Imitate the start of the trial
        clientSocket.emit('start-trial');
    });

    test('trial-start successful call, someone is killed, winning condition is not fulfilled', (done) => {
        const playerA = new Player(null, null, 'a', 'red', roles.IMPOSTOR, true);
        const playerB = new Player(null, null, 'b', 'red', roles.CREWMATE, true);
        const playerC = new Player(null, null, 'c', 'red', roles.JESTER, true);
        const playerD = new Player(null, null, 'd', 'red', roles.CREWMATE, true);
        const playerE = new Player(null, null, 'e', 'red', roles.CREWMATE, true);
        const hostPlayer = AUFGameMock.getHostPlayer(roomElements.roomID); // host is impostor

        AUFGameMock.addPlayer(playerA, roomElements.roomID);
        AUFGameMock.addPlayer(playerB, roomElements.roomID);
        AUFGameMock.addPlayer(playerC, roomElements.roomID);
        AUFGameMock.addPlayer(playerD, roomElements.roomID);
        AUFGameMock.addPlayer(playerE, roomElements.roomID);

        AUFGameMock.addTrialVote(hostPlayer, playerD, roomElements.roomID); // Vote to kill off a crewmate

        // Register mock event handlers for the events that the backend emits - assertions for the DTOs
        clientSocket.on('trial-start', (trialStartDTO) => {
            expect(trialStartDTO.timeToVote).toBe(config.trial_total_vote_time_in_milliseconds);
        });
        clientSocket.on('trial-end', (trialEndDTO) => {
            expect(trialEndDTO.playerKilled).toBe('d');
            expect(trialEndDTO.isGameOver).toBe(false);
            done();
        });

        // Imitate the start of the trial
        clientSocket.emit('start-trial');
    });

    test('trial-start successful call, someone is killed, winning condition is fulfilled', (done) => {
        const playerA = new Player(null, null, 'a', 'red', roles.IMPOSTOR, true);
        const playerB = new Player(null, null, 'b', 'red', roles.CREWMATE, true);
        const playerC = new Player(null, null, 'c', 'red', roles.CREWMATE, true);
        const playerD = new Player(null, null, 'd', 'red', roles.CREWMATE, true);
        const hostPlayer = AUFGameMock.getHostPlayer(roomElements.roomID); // host is impostor

        AUFGameMock.addPlayer(playerA, roomElements.roomID);
        AUFGameMock.addPlayer(playerB, roomElements.roomID);
        AUFGameMock.addPlayer(playerC, roomElements.roomID);
        AUFGameMock.addPlayer(playerD, roomElements.roomID);

        AUFGameMock.addTrialVote(hostPlayer, playerC, roomElements.roomID); // Vote to kill a crewmate

        // Register mock event handlers for the events that the backend emits - assertions for the DTOs
        clientSocket.on('trial-start', (trialStartDTO) => {
            expect(trialStartDTO.timeToVote).toBe(config.trial_total_vote_time_in_milliseconds);
        });
        clientSocket.on('trial-end', (trialEndDTO) => {
            expect(trialEndDTO.playerKilled).toBe('c');
            expect(trialEndDTO.isGameOver).toBe(true);
            done();
        });

        // Imitate the start of the trial
        clientSocket.emit('start-trial');
    });
});
