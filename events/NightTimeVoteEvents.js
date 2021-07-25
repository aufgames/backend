const RoleEnum = require('../domain/enum/Role');
const SuspectRevealDTO = require('../domain/dto/response/SuspectRevealDTO');

/**
 * Event handlers and logic for `impostor-vote`, 'medic-vote' and `detective-vote`
 * This involves the functionality for night-time voting, which includes:
 * - Impostor choosing who to kill before the next round
 * - Medics choosing who to save
 * - Detectives choosing who to suspect
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
exports.loadNightTimeEvents = (io, socket, aufGame) => {
    /**
     * Handler for 'impostor-vote', sets the chosen player for the Impostor to the player specified in the message.
     * In future iterations, this will be changed to tally votes from impostor members before setting the chosen player.
     */
    socket.on('impostor-vote', (impostorVoteObj) => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        room.voteHandler.impostorVoteMap[socket.player.nickname] = room.getPlayerByNickname(impostorVoteObj.votingFor);
    });

    /**
     * Handler for 'medic-vote', pretty much the same logic as the impostor vote, except it sets the chosen player for the Medics.
     */
    socket.on('medic-vote', (medicVoteObj) => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        room.voteHandler.medicChosenPlayer = room.getPlayerByNickname(medicVoteObj.votingFor);
    });

    /**
     * Handler for detective vote. Retrieves the player specified in the message, checks their role, and replies with a
     * SuspectRevealDTO that reveals whether the chosen player is Impostor or not.
     */
    socket.on('detective-vote', (detectiveVoteObj) => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        const suspect = room.getPlayerByNickname(detectiveVoteObj.votingFor);
        room.voteHandler.detectiveChosenPlayer = suspect;
        socket.emit('suspect-reveal', new SuspectRevealDTO(suspect.nickname, suspect.role === RoleEnum.IMPOSTOR));
    });
};
