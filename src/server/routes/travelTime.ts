import { Router } from 'express';

import { getTravelTimeByTransit } from '../controllers/travelTime';
import { wrapAsync } from '../util/misc';

const router = Router();

router.route('/tavelTime/transit')
  .get(wrapAsync(getTravelTimeByTransit));

export default router;
