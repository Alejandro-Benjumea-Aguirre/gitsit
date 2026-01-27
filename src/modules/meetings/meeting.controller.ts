import { Request, Response } from 'express';
import {createMeeting, MeetingsService} from './meeting.service.ts';

export const create = async (req: Request, res: Response) => {
  try {
    const { medicId, patientId } = req.body;

    const meeting = await meetingService.createMeeting(
      medicId,
      patientId
    );

    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando la reunión' });
  }
};

export const startRecording = async (req: Request, res: Response) => {
  try {
    const meetingId = req.params.id;

    const result = await MeetingsService.startRecording(meetingId);

    return res.status(200).json({
      message: 'Recording started',
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Error starting recording',
    });
  }
};

export const stopRecording = async (req: Request, res: Response) => {
  try {
    const meetingId = req.params.id;

    const result = await MeetingsService.stopRecording(meetingId);

    return res.status(200).json({
      message: 'Recording stopped',
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Error stopping recording',
    });
  }
};