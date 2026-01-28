import jwt from 'jsonwebtoken';

const APP_ID = 'jitsi-app';
const APP_SECRET = process.env.JITSI_SECRET!;

export function generateJitsiToken({
  userId,
  name,
  email,
  meetingId,
  isModerator = false,
}) {
  const payload = {
    aud: 'jitsi',
    iss: APP_ID,
    sub: 'meet.tudominio.com',
    room: meetingId,
    exp: Math.floor(Date.now() / 1000) + (60 * 30), // 30 minutos
    context: {
      user: {
        id: userId,
        name,
        email,
        moderator: isModerator,
      },
    },
  };

  return jwt.sign(payload, APP_SECRET);
}