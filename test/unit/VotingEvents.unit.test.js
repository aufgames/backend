const Client = require('socket.io-client');
const VoteForDTO = require('../../domain/dto/request/VoteForDTO');
const config = require('../../config.json');
const AUFGameMock = require('../mocks/AUFGameMock');
const Player = require('../../domain/Player');
const RoleEnum = require('../../domain/enum/Role');
const NightTimeVoteDTO = require('../../domain/dto/request/NightTimeVoteDTO');

let clientSocket;
const port = process.env.PORT || config.local_port;
const roomElements = AUFGameMock.createAUFGameWithOnePlayerMock(port);

beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
});

// Disconnect each socket connected to the server
afterEach((done) => {
    const { sockets } = roomElements.io.sockets;

    // Iterate through each connected client and disconnect them.
    sockets.forEach((socket) => {
        socket.disconnect(true);
    });

    done();
});

// Close the server once all tests are done
afterAll(() => {
    roomElements.socketIOServer.close();
});

describe('voting-events tests', () => {
    let players = [];
    beforeAll(() => {
        players = [
            new Player(null, roomElements.roomID, 'P0', 'red', RoleEnum.CREWMATE, false),
            new Player(null, roomElements.roomID, 'P1', 'red', RoleEnum.CREWMATE, true),
        ];
        AUFGameMock.addPlayers(players, roomElements.roomID);
    });

    test('day vote test', (done) => {
        // Subscribe to day-vote-update, to check that the vote has been registered correctly
        clientSocket.on('day-vote-update', (listVoteDTO) => {
            try {
                expect(listVoteDTO).toEqual({ voteMap: { impostorPlayer: 'P1' } });
                done();
            } catch (error) {
                done.fail(error);
            }
        });

        // Cast vote
        const voteForDTO = new VoteForDTO('P1');
        clientSocket.emit('day-vote', voteForDTO);
    });

    test('trial vote test', (done) => {
        // Subscribe to trial-vote-update
        clientSocket.on('trial-vote-update', (listVoteDTO) => {
            try {
                expect(listVoteDTO).toEqual({ voteMap: { impostorPlayer: 'P1' } });
                done();
            } catch (error) {
                done.fail(error);
            }
        });

        // Cast trial vote
        const voteForDTO = new VoteForDTO('P1');
        clientSocket.emit('trial-vote', voteForDTO);
    });
});

describe('night time voting event tests', () => {
    beforeAll(() => {
        const players = [
            new Player(null, roomElements.roomID, 'notImpostor', 'red', RoleEnum.IMPOSTOR, false),
            new Player(null, roomElements.roomID, 'Doctor', 'red', RoleEnum.MEDIC, true),
            new Player(null, roomElements.roomID, 'Sherlock', 'red', RoleEnum.DETECTIVE, false),
        ];
        AUFGameMock.addPlayers(players, roomElements.roomID);
    });

    test('impostor votes w/ no medic vote', (done) => {
        // Listen for night end to check that player has been killed.
        clientSocket.on('night-end', (nightEndDTO) => {
            try {
                expect(nightEndDTO.playerKilled).toEqual('P0');
                done();
            } catch (error) {
                done.fail(error);
            }
        });

        // Switch to impostor player to make vote
        AUFGameMock.switchPlayer('notImpostor', roomElements.roomID);
        clientSocket.emit('impostor-vote', new NightTimeVoteDTO('P0'));
        AUFGameMock.switchPlayer('impostorPlayer', roomElements.roomID);
        clientSocket.emit('impostor-vote', new NightTimeVoteDTO('P0'));

        clientSocket.emit('start-night');
    });

    test('impostor and medic vote same player', (done) => {
        // Listen for night end to check that nobody has been killed.
        clientSocket.on('night-end', (nightEndDTO) => {
            try {
                expect(nightEndDTO.playerKilled).toEqual(null);
                done();
            } catch (error) {
                done.fail(error);
            }
        });

        // Switch to impostor player to make vote
        AUFGameMock.switchPlayer('notImpostor', roomElements.roomID);
        clientSocket.emit('impostor-vote', new NightTimeVoteDTO('P0'));
        AUFGameMock.switchPlayer('impostorPlayer', roomElements.roomID);
        clientSocket.emit('impostor-vote', new NightTimeVoteDTO('P0'));

        // Switch to medic to save same player as impostor player
        AUFGameMock.switchPlayer('Doctor', roomElements.roomID);
        clientSocket.emit('medic-vote', new NightTimeVoteDTO('P0'));

        clientSocket.emit('start-night');
    });

    test('detective vote for impostor', (done) => {
        detectiveVoteTest('notImpostor', true, done);
    });

    test('detective vote for town', (done) => {
        detectiveVoteTest('Doctor', false, done);
    });
});

/**
 * Helper function to test detective-vote and suspect-reveal events.
 * @param {*} suspect The nickname of the player being voted for by the detective
 * @param {*} shouldBeImpostor The expected value of the isImpostor field in the SuspectRevealDTO
 * @param {*} done The done callback from the jest test function
 */
function detectiveVoteTest(suspect, shouldBeImpostor, done) {
    // Listen for suspect reveal event, check that player is revealed as town
    clientSocket.on('suspect-reveal', (suspectRevealDTO) => {
        try {
            expect(suspectRevealDTO.isImpostor).toEqual(shouldBeImpostor);
            done();
        } catch (error) {
            done.fail(error);
        }
    });

    // Switch to detective, submit detective vote
    AUFGameMock.switchPlayer('Sherlock', roomElements.roomID);
    clientSocket.emit('detective-vote', new NightTimeVoteDTO(suspect));
}
