import { Router } from 'express';

import { wrapAsync } from '../util/misc.js';
import {
  signUp,
  signIn,
  verifyToken,
  getUserProfile,
  getAllPlaces,
  createPlace,
  updatePlace,
  deletePlace,
} from '../controllers/user.js';

const router = Router();

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
  .patch(wrapAsync(verifyToken), wrapAsync(updatePlace));

router.route('/user/places/:id')
  .delete(wrapAsync(verifyToken), wrapAsync(deletePlace));

export default router;
