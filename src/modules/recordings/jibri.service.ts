import axios from 'axios';

interface StartRecordingParams {
  roomName: string;
  recordingId: string;
  appData?: any;
}

export class JibriAPIService {
  private static baseURL = process.env.JIBRI_API_URL || 'http://localhost:3001';
  private static apiKey = process.env.JIBRI_API_KEY || '';

  /**
   * Iniciar grabación vía API REST
   */
  static async startRecording({ roomName, recordingId, appData }: StartRecordingParams) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/jibri/start`,
        {
          roomName,
          sessionId: recordingId,
          appData,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ Respuesta de API Jibri:', response.data);

      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Error de API:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Error al iniciar grabación');
      }
      throw error;
    }
  }

  /**
   * Detener grabación vía API REST
   */
  static async stopRecording(recordingId: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/jibri/stop`,
        {
          sessionId: recordingId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ Respuesta de API Jibri:', response.data);

      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Error de API:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Error al detener grabación');
      }
      throw error;
    }
  }

  /**
   * Obtener estado de Jibri
   */
  static async getStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/jibri/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;

    } catch (error) {
      console.error('❌ Error obteniendo estado:', error);
      throw error;
    }
  }
}
