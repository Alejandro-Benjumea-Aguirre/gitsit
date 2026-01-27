import prisma from '../../lib/prisma';
import { JibriService } from '../recordings/jibri.service';

// Tipos para mejor type safety
interface CreateMeetingParams {
  medicId: string;
  patientId: string;
}

interface StartRecordingParams {
  roomName: string;
  recordingId: string;
}

interface StopRecordingParams {
  recordingId: string;
}

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

/**
 * Crea una nueva reunión entre un médico y un paciente
 */
export const createMeeting = async ({
  medicId,
  patientId,
}: CreateMeetingParams) => {
  const roomName = `meeting-${crypto.randomUUID()}`;

  return prisma.meeting.create({
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
};

export class MeetingsService {
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