import jwt from 'jsonwebtoken';

const APP_ID = process.env.JITSI_APP_ID;
const APP_SECRET = process.env.JITSI_SECRET!;

interface GenerateJitsiTokenParams {
  userId: string;
  meetingId: string;
  isModerator: boolean;
}

export function generateJitsiToken({
  userId,
  meetingId,
  isModerator = false,
}: GenerateJitsiTokenParams) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'jitsi',
    iss: APP_ID,
    sub: 'meet.tudominio.com',
    room: meetingId,
    exp: now + 60 * 10, // 10 minutos
    nbf: now - 10,
    context: {
      user: {
        id: userId,
        moderator: isModerator,
      },
      features: {
        livestreaming: false,
        recording: isModerator,
        transcription: false,
      },
    },
  };

  return jwt.sign(payload, APP_SECRET, {
    algorithm: 'HS256',
  });
}
