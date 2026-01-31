import { Router } from 'express';
import { jibriWebhook } from './recording.controller.js';

const router = Router();

router.post('/jibri-events', jibriWebhook);

export default router;
