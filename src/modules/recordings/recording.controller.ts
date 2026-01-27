import { Request, Response } from 'express';
import { RecordingsService } from './recordings.service';

export const jibriWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    await RecordingsService.handleJibriEvent(payload);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Invalid webhook payload',
    });
  }
};
