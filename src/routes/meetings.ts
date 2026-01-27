import { Router } from 'express';
import meetingsRoutes from '../modules/meetings/meeting.routes.ts';

const router = Router();

router.use('/', meetingsRoutes);

export default router;
