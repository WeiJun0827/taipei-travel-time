const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
    signUp,
    signIn,
    verifyToken,
    getUserProfile,
    getAllPlaces,
    createPlace,
    getPlace,
    updatePlace,
    deletePlace
} = require('../controllers/user_controller');

router.route('/user/signup')
    .post(wrapAsync(signUp));

router.route('/user/signin')
    .post(wrapAsync(signIn));

router.route('/user/profile')
    .get(wrapAsync(verifyToken), wrapAsync(getUserProfile));

router.route('/user/places')
    .get(wrapAsync(verifyToken), wrapAsync(getAllPlaces));

router.route('/user/places')
    .post(wrapAsync(verifyToken), wrapAsync(createPlace));

router.route('/user/places/:id')
    .get(wrapAsync(verifyToken), wrapAsync(getPlace));

router.route('/user/places/:id')
    .patch(wrapAsync(verifyToken), wrapAsync(updatePlace));

router.route('/user/places/:id')
    .delete(wrapAsync(verifyToken), wrapAsync(deletePlace));

module.exports = router;