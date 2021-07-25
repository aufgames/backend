const NightStateChangeEvents = require('./NightStateChangeEvents');
const DayStateChangeEvents = require('./DayStateChangeEvents');
const TrialStateChangeEvents = require('./TrialStateChangeEvents');

module.exports = function (io, socket, aufGame) {
    NightStateChangeEvents.eventHandlersRegistration(io, socket, aufGame);
    DayStateChangeEvents.eventHandlersRegistration(io, socket, aufGame);
    TrialStateChangeEvents.eventHandlersRegistration(io, socket, aufGame);
};
