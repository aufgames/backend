const Client = require('socket.io-client');
const AUFGameMock = require('../mocks/AUFGameMock');
const config = require('../../config.json');
const Player = require('../../domain/Player');
const roles = require('../../domain/enum/Role');

describe('start-day unit tests', () => {
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

        done();
    });

    // Close the server once all tests are done
    afterAll(() => {
        roomElements.socketIOServer.close();
    });

    test('start-day successful call, no player on trial', (done) => {
        // Registering mock event handlers that would respond to emits emitted by the backend
        clientSocket.on('day-start', (dayStartDTO) => {
            expect(dayStartDTO.timeToVote).toBe(config.day_total_vote_time_in_milliseconds);
        });
        clientSocket.on('discussion-end', (discussionEndDTO) => {
            expect(discussionEndDTO.playerOnTrial).toBeNull();
            done();
        });

        // Imitate the start of a day discussion
        clientSocket.emit('start-day');
    });

    test('start-day successful call, someone is put on trial', (done) => {
        const impostorPlayer = new Player(null, null, 'a', 'red', roles.IMPOSTOR, true);
        const crewmatePlayer = new Player(null, null, 'b', 'red', roles.CREWMATE, true);
        const hostPlayer = AUFGameMock.getHostPlayer(roomElements.roomID); // host is impostor

        AUFGameMock.addPlayer(impostorPlayer, roomElements.roomID);
        AUFGameMock.addPlayer(crewmatePlayer, roomElements.roomID);

        AUFGameMock.addDayVote(impostorPlayer, crewmatePlayer, roomElements.roomID); // Impostor votes for crewmate
        AUFGameMock.addDayVote(hostPlayer, crewmatePlayer, roomElements.roomID); // host votes for crewmate

        // Registering mock event handlers that would respond to emits emitted by the backend
        clientSocket.on('day-start', (dayStartDTO) => {
            expect(dayStartDTO.timeToVote).toBe(config.day_total_vote_time_in_milliseconds);
        });
        clientSocket.on('discussion-end', (discussionEndDTO) => {
            expect(discussionEndDTO.playerOnTrial).toBe('b');
            done();
        });

        // Imitate the start of a day discussion
        clientSocket.emit('start-day');
    });
});
