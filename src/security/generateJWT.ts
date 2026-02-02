import jwt from 'jsonwebtoken';
import { jitsiConfig } from '../config/jitsi.config.ts';
import type { JitsiJWTPayload } from '../types/jitsi.types.ts';

interface GenerateJitsiTokenParams {
  userId: string;
  userName: string;
  userEmail: string;
  meetingId: string;
  isModerator: boolean;
  features?: {
    recording?: boolean;
    livestreaming?: boolean;
    transcription?: boolean;
  };
}

export function generateJitsiToken({
  userId,
  userName,
  userEmail,
  meetingId,
  isModerator = false,
  features,
}: GenerateJitsiTokenParams) {
  const now = Math.floor(Date.now() / 1000);

  const payload: JitsiJWTPayload = {
    aud: jitsiConfig.jwt.appId,
    iss: jitsiConfig.jwt.issuer,
    sub: jitsiConfig.domain,
    room: meetingId,
    //exp: now + 60 * 10, // 10 minutos
    nbf: now - 10,
    moderator: isModerator,
    context: {
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        moderator: isModerator,
      },
      features: features || jitsiConfig.features,
    },
  };

  console.log(payload);

  const token = jwt.sign(payload, jitsiConfig.jwt.appSecret, {
    algorithm: 'HS256',
    expiresIn: jitsiConfig.jwt.expiresIn,
  });

  return token;
}
