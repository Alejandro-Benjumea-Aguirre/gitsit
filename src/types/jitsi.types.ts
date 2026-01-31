export interface JitsiConfig {
  domain: string;
  roomPrefix: string;
  jwt: {
    appId: string;
    appSecret: string;
    issuer: string;
    expiresIn: string;
  };
}

export interface JitsiJWTPayload {
  context: {
    user: {
      id: string;
      moderator?: boolean;
    };
    features?: {
      recording?: boolean;
      livestreaming?: boolean;
      transcription?: boolean;
    };
  };
  room: string;
  aud: string;
  iss: string;
  sub: string;
  exp?: number;
  nbf?: number;
  moderator?: boolean;
}

export interface JitsiMeetingOptions {
  roomName: string;
  jwt?: string;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    enableWelcomePage?: boolean;
    prejoinPageEnabled?: boolean;
    disableDeepLinking?: boolean;
  };
  interfaceConfigOverwrite?: {
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    TOOLBAR_BUTTONS?: string[];
  };
}

export interface CreateMeetingDTO {
  medicId: string;
  patientId: string;
}

export interface JoinMeetingDTO {
  meetingId: string;
  userId: string;
}
