const roles = require('../domain/enum/Role');
const GameStartDTO = require('../domain/dto/response/GameStartDTO');
const SetUsersDTO = require('../domain/dto/response/SetUsersDTO');
const config = require('../config.json');



/**
 * Event handler of `start-game`
 * The game has started! Broadcast individual roles to everyone.
 * @param {any} io
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
function startGame(io, socket, aufGame) {
    socket.on('start-game', () => {
        const room = aufGame.gameRoomsDict[socket.player.roomID];
        const { players } = room;
        const availableRoles = getAvailableRolesToAssign(players.length);

        broadcastRandomRoleToEachPlayer(io, players, availableRoles);

        const users = [];
        players.forEach((player) => {
            
                users.push(player);
       
        });
        io.in(socket.player.roomID).emit(
            'set-users',
            new SetUsersDTO(
                users
            )
        );
    });
}

/**
 * Helper function to broadcast roles to each player.
 * @param {any} socket
 * @param {Array} players
 * @param {Array} availableRoles
 */
function broadcastRandomRoleToEachPlayer(io, players, availableRoles) {
    const playersDeepCopy = JSON.parse(JSON.stringify(players));

    while (playersDeepCopy.length > 0) {
        // Determine random indices to help allocate a random role to a random player
        const randomRoleIndex = Math.floor(Math.random() * availableRoles.length);
        const randomPlayerIndex = Math.floor(Math.random() * playersDeepCopy.length);

        const role = availableRoles[randomRoleIndex];
        const player = playersDeepCopy[randomPlayerIndex];
        players.find((p) => p.nickname === player.nickname).role = role;

        // player.role = role;
        io.to(player.socketID).emit('game-start', new GameStartDTO(role));

        // Delete the player and the role which was just allocated
        availableRoles.splice(randomRoleIndex, 1);
        playersDeepCopy.splice(randomPlayerIndex, 1);
    }
}

/**
 * Helper function to get all the roles to assign. The number of times a role occurs in the
 * returned array depends on the number of players playing the game.
 * @param {any} numOfPlayers
 */
function getAvailableRolesToAssign(numOfPlayers) {
    const roleLogic = config.role_distribution_logic;

    // Calculate the number of roles available of each type
    let numOfImpostor;
    if (numOfPlayers < roleLogic.impostor_role_threshold) {
        numOfImpostor = Math.ceil(numOfPlayers / roleLogic.impostor_divisor_1);
    } else {
        numOfImpostor = Math.ceil(numOfPlayers / roleLogic.impostor_divisor_2);
    }
    const numOfDetectives = Math.ceil(numOfPlayers / roleLogic.detective_divisor);
    const numOfMedics = Math.ceil(numOfPlayers / roleLogic.medic_divisor);
    const numOfJesters = Math.ceil(numOfPlayers / roleLogic.jester_divisor);
    const numOfCrewmates = numOfPlayers - (numOfImpostor + numOfDetectives + numOfMedics + numOfJesters);

    // Return an array of roles, with each role occuring once or more depending on the number of players
    // playing the game
    const rolesToAssign = [];
    addRoleToArray(rolesToAssign, roles.IMPOSTOR, numOfImpostor);
    addRoleToArray(rolesToAssign, roles.MEDIC, numOfMedics);
    addRoleToArray(rolesToAssign, roles.DETECTIVE, numOfDetectives);
    addRoleToArray(rolesToAssign, roles.JESTER, numOfJesters);
    addRoleToArray(rolesToAssign, roles.CREWMATE, numOfCrewmates);

    return rolesToAssign;
}

function addRoleToArray(roleArray, role, occuranceCount) {
    for (let i = 0; i < occuranceCount; i += 1) {
        roleArray.push(role);
    }
}

/**
 * Event handlers and logic for all of the game start related events
 * Current namespaces: start-game
 * @param {any} socket
 * @param {AUFGame} aufGame
 */
module.exports = function (io, socket, aufGame) {
    startGame(io, socket, aufGame);
};
