import fsPromise from 'fs/promises';
import fs from 'fs';
import crypto from 'crypto';

import prisma from '../../lib/prisma';

type JibriEventPayload = {
  recordingId: string;
  meetingId: string;
  status: 'FINISHED' | 'FAILED';
  filePath?: string;
  duration?: number;
  size?: number;
  error?: string;
};

export class RecordingsService {
  static async handleJibriEvent(payload: JibriEventPayload) {
    const { recordingId, status, filePath } = payload;

    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new Error('Grabacion no encontrada.');
    }

    if (status === 'FINISHED') {
      try {
        const validation = await this.validateRecordingFile(filePath);

        const [hash, duration] = await Promise.all([
          this.generateSHA256(filePath),
          this.getDuration(filePath),
        ]);

        await prisma.recording.update({
          where: { id: recording.id },
          data: {
            status: 'READY',
            filePath: payload.filePath,
            size: validation.size,
            duration,
            hash,
            endedAt: new Date(),
          },
        });
      } catch (error: any) {
        await prisma.recording.update({
          where: { id: recording.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            endedAt: new Date(),
          },
        });
      }
    }

    if (status === 'FAILED') {
      await prisma.recording.update({
        where: { id: recordingId },
        data: {
          status: 'FAILED',
          errorMessage: payload.error || 'Unknown error',
          endedAt: new Date(),
        },
      });
    }
  }

  static async validateRecordingFile(filePath: string) {
    try {
      const stats = await fsPromise.stat(filePath);

      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      if (stats.size === 0) {
        throw new Error('File is empty');
      }

      return {
        exists: true,
        size: stats.size,
      };
    } catch (error) {
      throw new Error('Recording file not found or invalid');
    }
  }

  static async generateSHA256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  static async getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      exec(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
        (error, stdout) => {
          if (error) return reject(error);
          resolve(Math.floor(Number(stdout)));
        }
      );
    });
  }
}
