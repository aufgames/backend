/**
 * Enum for player status.
 * Can be developed into classes if functionality is required.
 */
const PlayerStatus = {
    ALIVE: 'alive',
    KILLED_BY_IMPOSTOR: 'killed_by_impostor',
    KILLED_BY_TOWN: 'killed_by_town',
};
Object.freeze(PlayerStatus);

module.exports = PlayerStatus;
