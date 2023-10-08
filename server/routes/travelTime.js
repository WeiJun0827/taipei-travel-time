import { Router } from 'express';

import { getTravelTimeByTransit } from '../controllers/travelTime.js';
import { wrapAsync } from '../util/misc.js';

const router = Router();

router.route('/tavelTime/transit')
  .get(wrapAsync(getTravelTimeByTransit));

export default router;
