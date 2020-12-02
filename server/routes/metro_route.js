const router = require('express').Router();
const {wrapAsync} = require('../../util/util');

const {
    getCampaigns,
    getHots
} = require('../controllers/metro_controller');

router.route('/marketing/campaigns')
    .get(wrapAsync(getCampaigns));

module.exports = router;