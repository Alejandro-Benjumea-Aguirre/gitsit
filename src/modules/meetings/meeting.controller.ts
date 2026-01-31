import type { Request, Response } from 'express';
import { MeetingsService } from './meeting.service.ts';
import { success, error } from '../../utils/response.ts';
import type {JoinMeetingDTO} from '../../types/jitsi.types.js';

export const create = async (req: Request, res: Response) => {
  try {
    const { medicId, patientId } = req.body;

    if (!medicId || !patientId) {
      return error(req, res, 'medicId y patientId son requeridos', 400);
    }

    const meeting = await MeetingsService.createMeeting({ medicId, patientId });

    success(req, res, meeting, 201);
  } catch (e) {
    console.error(e);
    error(req, res, 'Error creando la reunión', 500);
  }
};

export const token = async (req: Request, res: Response) => {
  try {
    const { meetingId, user } = req.body;

    if (!user) {
      return error(req, res, 'userId es requerido', 400);
    }

    const data = {
      meetingId,
      user,
    };

    const token = await MeetingsService.createMeetingToken(data);

    success(req, res, token, 200);
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

/**
 * GET /api/meetings/:meetingId
 * Obtener información de reunión
 */
export const getMeeting = async (req: Request, res: Response) => {
  try {
    const { meetingId, userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido',
      });
    }

    const meeting = await MeetingsService.getMeeting(
      meetingId as string,
      userId as string
    );

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error('Error obteniendo reunión:', error);

    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Reunión no encontrada',
    });
  }
};
