const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
    getTravelTimeByTransit
} = require('../controllers/travel_time_controller');

router.route('/tavelTime/transit')
    .get(wrapAsync(getTravelTimeByTransit));

module.exports = router;