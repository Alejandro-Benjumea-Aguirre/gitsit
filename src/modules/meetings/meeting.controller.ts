import { Request, Response } from 'express';
import { MeetingsService } from './meeting.service.ts';
import { success, error } from '../../utils/response.ts';

export const token = async (req: Request, res: Response) => {
  try {
    const { meetingId, user } = req.body;

    const token = await MeetingsService.createMeetingToken(meetingId, user);

    success(req, res, token, 200);
  } catch (e) {
    console.error(e);
    error(req, res, 'Error creando la reunión', 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { medicId, patientId } = req.body;

    const meeting = await MeetingsService.createMeeting({ medicId, patientId });

    success(req, res, meeting, 201);
  } catch (e) {
    console.error(e);
    error(req, res, 'Error creando la reunión', 500);
  }
};

export const startRecording = async (req: Request, res: Response) => {
  try {
    const meetingId: string = req.params.id || '';

    const result = await MeetingsService.startRecording(meetingId);

    success(req, res, { message: 'Recording started', data: result }, 200);
  } catch (e) {
    console.error(e);
    return error(req, res, 'Error starting recording', 400);
  }
};

export const stopRecording = async (req: Request, res: Response) => {
  try {
    const meetingId: string = req.params.id || '';

    const result = await MeetingsService.stopRecording(meetingId);

    success(req, res, { message: 'Recording stopped', data: result }, 200);
  } catch (e) {
    console.error(e);
    return error(req, res, 'Error stopping recording', 400);
  }
};
