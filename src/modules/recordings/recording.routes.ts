import { Router } from 'express';
import { jibriWebhook } from './recordings.controller';

const router = Router();

router.post('/jibri-events', jibriWebhook);

export default router;