const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
    signUp,
    signIn,
    hasToken,
    getUserProfile,
    getMySavedPlacesList
} = require('../controllers/user_controller');

router.route('/user/signup')
    .post(wrapAsync(signUp));

router.route('/user/signin')
    .post(wrapAsync(signIn));

router.route('/user/profile')
    .get(wrapAsync(hasToken), wrapAsync(getUserProfile));

router.route('/user/mySavedPlaces')
    .get(wrapAsync(hasToken), wrapAsync(getMySavedPlacesList));

module.exports = router;