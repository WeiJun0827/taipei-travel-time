import { Router } from 'express';

import { getTravelTimeByTransit } from '../controllers/travel_time_controller.js';
import { wrapAsync } from '../../util/util.js';

const router = Router();

router.route('/tavelTime/transit')
  .get(wrapAsync(getTravelTimeByTransit));

export default router;
