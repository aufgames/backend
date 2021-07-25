const ListVoteDTO = require('../domain/dto/response/ListVoteDTO');
const VoteType = require('../../common/enum/Vote');

/**
 * Event handler and logic for `day-vote`
 * The goal of these vote events is to allow a player to vote for another player and every
 * other player to receive a list of votes.
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
function voteDay(io, socket, aufGame) {
    socket.on('day-vote', (voteForDTO) => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        const voter = socket.player;
        const votee = voteForDTO.votingFor;
        room.voteHandler.daytimeVoteMap[voter.nickname] = room.getPlayerByNickname(votee);
        io.in(socket.player.roomID).emit('day-vote-update', new ListVoteDTO(room.voteHandler.daytimeVoteMap));
    });
}

/**
 * Event handler and logic for `trail-vote`
 * The goal of these vote events is to allow a player to vote for another player and every
 * other player to receive a list of votes.
 * @param {any} io: server socket instance
 * @param {any} socket client socket connection to the server
 * @param {AUFGame} aufGame: Object mirroring the real world AUF game
 */
function voteTrial(io, socket, aufGame) {
    socket.on('trial-vote', (voteForDTO) => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        const voter = socket.player;
        const votee = voteForDTO.votingFor;
        room.voteHandler.trialVoteMap[voter.nickname] =
            votee === VoteType.NoConfidenceVote ? VoteType.NoConfidenceVote : room.getPlayerByNickname(votee);
        io.in(socket.player.roomID).emit('trial-vote-update', new ListVoteDTO(room.voteHandler.trialVoteMap));
    });
}

/**
 * Event handlers and logic for all of the vote-related events
 * Current namespaces: day-vote, trail-vote
 * @param {any} io: server socket instance
 * @param {any} socket client socket connection to the server
 * @param {AUFGame} aufGame: Object mirroring the real world AUF game
 */
module.exports = function (io, socket, aufGame) {
    voteDay(io, socket, aufGame);
    voteTrial(io, socket, aufGame);
};
