// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
    return function(req, res, next) {
        // Make sure to `.catch()` any errors and pass them along to the `next()`
        // middleware in the chain, in this case the error handler.
        fn(req, res, next).catch(next);
    };
};

const parseIntToWeekday = (index) => {
    if (index == 0) return 'Mon';
    if (index == 1) return 'Tue';
    if (index == 2) return 'Wed';
    if (index == 3) return 'Thu';
    if (index == 4) return 'Fri';
    if (index == 5) return 'Sat';
    if (index == 6) return 'Sun';
    throw new Error('Invalid integer for parsing into weekday');
};


const parseDatetimeToWeekday = (datetimeStr) => {
    const day = new Date(datetimeStr).getDay();
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekday[day];
};

const calculateAverageExpectedTime = (expectedTimes) => {
    if (!expectedTimes || !expectedTimes.length || expectedTimes.length === 0)
        throw new Error('Invalid expected time array');
    let reciprocal = 0;
    for (const time of expectedTimes) {
        if (typeof time !== 'number' || Number.isNaN(time) || time < 0)
            throw new Error('Invalid expected time');
        if (time === 0) return 0;
        reciprocal += 1 / time;
    }
    return Math.round(1 / reciprocal);
};

module.exports = {
    wrapAsync,
    parseIntToWeekday,
    parseDatetimeToWeekday,
    calculateAverageExpectedTime
};