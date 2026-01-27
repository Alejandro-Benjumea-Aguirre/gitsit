import { Router } from 'express';
import recordingsRoutes from '../modules/recordings/recording.routes';

const router = Router();

router.use('/', recordingsRoutes);

export default router;
