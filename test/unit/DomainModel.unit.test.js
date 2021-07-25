const Player = require('../../domain/Player');
const Room = require('../../domain/Room');
const PlayerStatus = require('../../domain/enum/PlayerStatus');
const Role = require('../../domain/enum/Role');

describe('Add Player tests', () => {
    for (let playerCount = 6; playerCount <= 15; playerCount += 1) {
        test('room add X players', () => {
            const room = new Room();

            for (let i = 1; i <= playerCount; i += 1) {
                const player = new Player(`0000${i}`, `room${i}`, `nickname${i}`);
                room.addPlayer(player);
            }

            expect(room.players.length).toBe(playerCount);
        });
    }
});

describe('winning role tests', () => {
    let room;
    let jester;
    let crewmate1;
    let crewmate2;
    let impostor;
    let medic;
    let detective;

    beforeEach(() => {
        jester = new Player('00001', 'room1', 'nickname1', 'red', Role.JESTER, true);
        crewmate1 = new Player('00002', 'room1', 'nickname2', 'red', Role.CREWMATE, false);
        crewmate2 = new Player('00003', 'room1', 'nickname3', 'red', Role.CREWMATE, false);
        impostor = new Player('00004', 'room1', 'nickname4', 'red', Role.IMPOSTOR, false);
        medic = new Player('00005', 'room1', 'nickname5', 'red', Role.MEDIC, false);
        detective = new Player('00006', 'room1', 'nickname6', 'red', Role.DETECTIVE, false);

        room = new Room();
        room.addPlayer(jester);
        room.addPlayer(crewmate1);
        room.addPlayer(crewmate2);
        room.addPlayer(impostor);
        room.addPlayer(medic);
        room.addPlayer(detective);
    });

    test('jester wins by getting killed in a trial', (done) => {
        expect(jester.status).toBe(PlayerStatus.ALIVE);

        let winningRole = room.getWinningRole();
        expect(winningRole).toBeNull();

        jester.status = PlayerStatus.KILLED_BY_TOWN;
        winningRole = room.getWinningRole();
        expect(winningRole).toBe(Role.JESTER);

        done();
    });

    test('crewmates win by eliminating impostor', (done) => {
        impostor.status = PlayerStatus.KILLED_BY_TOWN;
        const winningRole = room.getWinningRole();
        expect(winningRole).toBe(Role.CREWMATE);

        done();
    });

    test('impostor wins by eliminating everyone except one', (done) => {
        // Two good players still alive - game should not be over yet.
        crewmate1.status = PlayerStatus.KILLED_BY_IMPOSTOR;
        crewmate2.status = PlayerStatus.KILLED_BY_TOWN;
        medic.status = PlayerStatus.KILLED_BY_IMPOSTOR;

        let winningRole = room.getWinningRole();
        expect(winningRole).toBeNull();

        // Impostor kills detective and only jester remians - impostor should win.
        detective.status = PlayerStatus.KILLED_BY_IMPOSTOR;

        winningRole = room.getWinningRole();
        expect(winningRole).toBe(Role.IMPOSTOR);

        done();
    });

    test('jester does not win if killed by impostor', (done) => {
        jester.status = PlayerStatus.KILLED_BY_IMPOSTOR;

        let winningRole = room.getWinningRole();
        expect(winningRole).toBeNull();

        done();
    });
});
