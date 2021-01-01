require('dotenv');
const {
    parseIntToWeekday,
    parseDatetimeToWeekday,
    calculateAverageExpectedTime
} = require('../util/util');
const { assert } = require('./set_up');

describe('Util', () => {
    it('Parse int to weekday', () => {
        assert.equal(parseIntToWeekday(0), 'Mon');
        assert.equal(parseIntToWeekday(1), 'Tue');
        assert.equal(parseIntToWeekday(2), 'Wed');
        assert.equal(parseIntToWeekday(3), 'Thu');
        assert.equal(parseIntToWeekday(4), 'Fri');
        assert.equal(parseIntToWeekday(5), 'Sat');
        assert.equal(parseIntToWeekday(6), 'Sun');
        assert.equal(parseIntToWeekday('6'), 'Sun');
        assert.throws(() => parseIntToWeekday(7), Error);
        assert.throws(() => parseIntToWeekday(100), Error);
        assert.throws(() => parseIntToWeekday(), Error);
    });

    it('Parse datetime to weekday', () => {
        assert.equal(parseDatetimeToWeekday('2020-12-30'), 'Wed');
        assert.equal(parseDatetimeToWeekday('2020-12-31'), 'Thu');
    });

    it('Calculate average expected time', () => {
        assert.equal(calculateAverageExpectedTime([60, 120]), 120 / (2 + 1));
        assert.equal(calculateAverageExpectedTime([60, 120, 240]), Math.round(240 / (4 + 2 + 1)));
        assert.equal(calculateAverageExpectedTime([1, 1000, 1000]), 1);
        assert.equal(calculateAverageExpectedTime([0, 120, 240]), 0);
        assert.equal(calculateAverageExpectedTime([0]), 0);
        assert.throws(() => calculateAverageExpectedTime(), Error);
        assert.throws(() => calculateAverageExpectedTime(3), Error);
        assert.throws(() => calculateAverageExpectedTime('AA'), Error);
        assert.throws(() => calculateAverageExpectedTime([]), Error);
        assert.throws(() => calculateAverageExpectedTime({}), Error);
        assert.throws(() => calculateAverageExpectedTime([1, null]), Error);
        assert.throws(() => calculateAverageExpectedTime([1, 'A']), Error);
        assert.throws(() => calculateAverageExpectedTime([1, -1]), Error);
        assert.throws(() => calculateAverageExpectedTime([1, true]), Error);
        assert.throws(() => calculateAverageExpectedTime([1, {}]), Error);
    });
});