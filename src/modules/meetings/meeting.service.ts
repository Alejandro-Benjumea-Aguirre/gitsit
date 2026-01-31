import prisma from '../../lib/prisma.js';
import { JibriService } from '../recordings/jibri.service.js';
import { generateJitsiToken } from '../../security/generateJWT.js';
import { jitsiConfig } from '../../config/jitsi.config.ts';
import type { CreateMeetingDTO, JoinMeetingDTO } from '../types/jitsi.types';

// Constantes para evitar magic strings
const RECORDING_STATUS = {
  STARTING: 'STARTING',
  RECORDING: 'RECORDING',
  STOPPING: 'STOPPING',
  FINISHED: 'FINISHED',
} as const;

const PARTICIPANT_ROLE = {
  MEDIC: 'MEDIC',
  PATIENT: 'PATIENT',
} as const;

const EVENT_TYPE = {
  MEETING_CREATED: 'MEETING_CREATED',
} as const;

// Mensajes de error centralizados
const ERROR_MESSAGES = {
  MEETING_NOT_FOUND: 'Reunión no encontrada',
  RECORDING_ALREADY_ACTIVE: 'Ya existe una grabación activa para esta reunión',
  NO_ACTIVE_RECORDING: 'No hay ninguna grabación activa para detener',
} as const;

export class MeetingsService {
  /**
   * Crea una nueva reunión entre un médico y un paciente
   */
  static async createMeeting({ medicId, patientId }: CreateMeetingDTO) {
    const roomName = `${jitsiConfig.roomPrefix}-${crypto.randomUUID()}`;

    const meeting = await prisma.meeting.create({
      data: {
        roomName,
        participants: {
          create: [
            { userId: medicId, role: PARTICIPANT_ROLE.MEDIC },
            { userId: patientId, role: PARTICIPANT_ROLE.PATIENT },
          ],
        },
        events: {
          create: {
            type: EVENT_TYPE.MEETING_CREATED,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return meeting;
  }

  /**
   * Crea un token para la reunion
   */
  static async createMeetingToken(data: JoinMeetingDTO) {
    const { meetingId, userId } = data;

    // Verificar que la reunión existe
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!meeting) {
      throw new Error('Reunión no encontrada');
    }

    // Verificar que el usuario es participante
    const participant = meeting.participants[0];
    if (!participant) {
      throw new Error('Usuario no autorizado para esta reunión');
    }

    const isModerator = participant.role === 'MEDIC';

    const token = generateJitsiToken({
      meetingId,
      userId,
      isModerator,
      features: {
        recording: isModerator, // Solo el médico puede grabar
        livestreaming: false,
        transcription: true,
      },
    });

    const meetingUrl = this.generateMeetingUrl(meeting.roomName, token);

    // Registrar evento de ingreso
    await prisma.meetingEvent.create({
      data: {
        type: 'USER_JOINED',
        meetingId: meeting.id,
        metadata: {
          userId,
          role: participant.role,
        },
      },
    });

    return {
      meeting: {
        id: meeting.id,
        roomName: meeting.roomName,
      },
      token,
      meetingUrl,
      isModerator,
      expiresIn: jitsiConfig.jwt.expiresIn,
    };
  }

  /**
   * Genera URL completa de Jitsi con token
   */
  static generateMeetingUrl(roomName: string, token: string): string {
    return `https://${jitsiConfig.domain}/${roomName}?jwt=${token}`;
  }

  /**
   * Obtener información de una reunión
   */
  static async getMeeting(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: true,
        recordings: true,
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!meeting) {
      throw new Error('Reunión no encontrada o sin acceso');
    }

    return meeting;
  }

  /**
   * Obtiene una reunión por ID incluyendo sus grabaciones
   */
  private static async getMeetingWithRecordings(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { recordings: true },
    });

    if (!meeting) {
      throw new Error(ERROR_MESSAGES.MEETING_NOT_FOUND);
    }

    return meeting;
  }

  /**
   * Busca una grabación activa en la reunión
   */
  private static findActiveRecording(
    recordings: Array<{ status: string; id: string }>
  ) {
    return recordings.find((r) => r.status === RECORDING_STATUS.RECORDING);
  }

  /**
   * Inicia la grabación de una reunión
   */
  static async startRecording(meetingId: string) {
    // Obtener reunión y verificar existencia
    const meeting = await this.getMeetingWithRecordings(meetingId);

    // Verificar si ya hay una grabación activa
    const activeRecording = this.findActiveRecording(meeting.recordings);

    if (activeRecording) {
      throw new Error(ERROR_MESSAGES.RECORDING_ALREADY_ACTIVE);
    }

    // Crear registro de grabación en BD con estado STARTING
    const recording = await prisma.recording.create({
      data: {
        meetingId: meeting.id,
        status: RECORDING_STATUS.STARTING,
      },
    });

    try {
      // Solicitar inicio de grabación a Jibri
      await JibriService.startRecording({
        roomName: meeting.roomName,
        recordingId: recording.id,
      });

      // Actualizar estado a RECORDING
      const updatedRecording = await prisma.recording.update({
        where: { id: recording.id },
        data: {
          status: RECORDING_STATUS.RECORDING,
        },
      });

      return updatedRecording;
    } catch (error) {
      // Si falla Jibri, marcar grabación como fallida
      await prisma.recording.update({
        where: { id: recording.id },
        data: {
          status: 'FAILED',
          endedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Detiene la grabación activa de una reunión
   */
  static async stopRecording(meetingId: string) {
    // Obtener reunión y verificar existencia
    const meeting = await this.getMeetingWithRecordings(meetingId);

    // Buscar grabación activa
    const activeRecording = this.findActiveRecording(meeting.recordings);

    if (!activeRecording) {
      throw new Error(ERROR_MESSAGES.NO_ACTIVE_RECORDING);
    }

    // Marcar como STOPPING
    await prisma.recording.update({
      where: { id: activeRecording.id },
      data: {
        status: RECORDING_STATUS.STOPPING,
      },
    });

    try {
      // Enviar orden a Jibri para detener
      await JibriService.stopRecording({
        recordingId: activeRecording.id,
      });

      // Actualizar estado final
      const finishedRecording = await prisma.recording.update({
        where: { id: activeRecording.id },
        data: {
          status: RECORDING_STATUS.FINISHED,
          endedAt: new Date(),
        },
      });

      return finishedRecording;
    } catch (error) {
      // Si falla Jibri, marcar como fallida
      await prisma.recording.update({
        where: { id: activeRecording.id },
        data: {
          status: 'FAILED',
          endedAt: new Date(),
        },
      });

      throw error;
    }
  }
}
