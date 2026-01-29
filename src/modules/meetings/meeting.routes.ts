import { Router } from 'express';
import * as controller from './meeting.controller.ts';

const router = Router();

router.post('/token', controller.token);
router.post('/', controller.create);

router.post('/:id/start-recording', startRecording);
router.post('/:id/stop-recording', stopRecording);

export default router;
