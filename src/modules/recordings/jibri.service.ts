import axios from 'axios';

interface StartRecordingParams {
  roomName: string;
  recordingId: string;
}

export class JibriService {
  static async startRecording({ roomName, recordingId }: StartRecordingParams) {
    try {
      await axios.post('http://JIBRI_INTERNAL_IP:3333/start', {
        room: roomName,
        recordingId,
      });
    } catch (error) {
      throw new Error('Failed to start recording with Jibri');
    }
  }

  static async stopRecording({ recordingId }: { recordingId: string }) {
    try {
      await axios.post('http://JIBRI_INTERNAL_IP:3333/stop', {
        recordingId,
      });
    } catch (error) {
      throw new Error('Failed to stop recording with Jibri');
    }
  }
}
