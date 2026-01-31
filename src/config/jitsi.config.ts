import dotenv from 'dotenv';

dotenv.config();

export const jitsiConfig = {
  domain: process.env.JITSI_DOMAIN || 'alejodev.cloud',
  roomPrefix: process.env.JITSI_ROOM_PREFIX || 'medical',
  jwt: {
    appId: process.env.JWT_APP_ID || 'apijitsi',
    appSecret: process.env.JWT_APP_SECRET || '',
    issuer: process.env.JWT_ISSUER || 'apijitsi',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },

  jibri: {
    enabled: process.env.JIBRI_ENABLED === 'true',
    baseUrl: process.env.JIBRI_BASE_URL || '',
    apiKey: process.env.JIBRI_API_KEY || '',
    recordingsPath: process.env.JIBRI_RECORDINGS_PATH || '/recordings',
  },

  features: {
    recording: true,
    livestreaming: false,
    transcription: false,
  },
};

// Validar configuración crítica
if (!jitsiConfig.jwt.appSecret) {
  console.warn('JWT_APP_SECRET no está configurado');
}

if (jitsiConfig.jibri.enabled && !jitsiConfig.jibri.baseUrl) {
  console.warn('JIBRI_BASE_URL no está configurado pero Jibri está habilitado');
}

export default jitsiConfig;
