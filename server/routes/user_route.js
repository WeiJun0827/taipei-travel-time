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

router.route('/user/places')
    .get(wrapAsync(hasToken), wrapAsync(getAllPlaces));

router.route('/user/places')
    .post(wrapAsync(hasToken), wrapAsync(createPlace));

router.route('/user/places/:id')
    .get(wrapAsync(hasToken), wrapAsync(getPlace));

router.route('/user/places/:id')
    .patch(wrapAsync(hasToken), wrapAsync(updatePlace));

router.route('/user/places/:id')
    .delete(wrapAsync(hasToken), wrapAsync(deletePlace));

module.exports = router;