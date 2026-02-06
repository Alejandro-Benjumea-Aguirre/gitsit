// src/services/jibri-xmpp.service.ts

import { client, xml } from '@xmpp/client';

class JibriXMPPService {
  private static instance: JibriXMPPService;
  private xmppClient: any = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): JibriXMPPService {
    if (!JibriXMPPService.instance) {
      JibriXMPPService.instance = new JibriXMPPService();
    }
    return JibriXMPPService.instance;
  }

  /**
   * Conectar al servidor XMPP
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const config = {
          service: process.env.XMPP_SERVICE || 'xmpp://localhost:5222',
          domain: process.env.XMPP_DOMAIN || 'alejodev.cloud',
          username: process.env.XMPP_USERNAME || 'focus',
          password: process.env.XMPP_PASSWORD || '',
        };

        console.log('🔌 Conectando a XMPP...');
        console.log('   Service:', config.service);
        console.log('   Domain:', config.domain);
        console.log('   Username:', config.username);

        this.xmppClient = client({
          service: config.service,
          domain: config.domain,
          username: config.username,
          password: config.password,
        });

        this.xmppClient.on('error', (err: any) => {
          console.error('❌ XMPP Error:', err);
          this.isConnected = false;
        });

        this.xmppClient.on('offline', () => {
          console.log('📴 XMPP Offline');
          this.isConnected = false;
        });

        this.xmppClient.on('online', async (address: any) => {
          console.log('✅ XMPP Conectado:', address.toString());
          this.isConnected = true;
          resolve();
        });

        this.xmppClient.on('stanza', (stanza: any) => {
          if (stanza.attrs.from?.includes('jibri')) {
            console.log('📥 Respuesta de Jibri:', stanza.toString());
          }
        });

        await this.xmppClient.start();

      } catch (error) {
        console.error('❌ Error conectando XMPP:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * ⭐ MÉTODO PRINCIPAL: Iniciar grabación
   *
   * @param roomName - Nombre de la sala (ej: "medical-uuid-123")
   * @param sessionId - ID único de la sesión de grabación (ej: ID del registro en BD)
   */
  async startRecording(roomName: string, sessionId: string): Promise<void> {
    console.log('🎬 === INICIANDO GRABACIÓN ===');
    console.log('   Room Name:', roomName);
    console.log('   Session ID:', sessionId);

    // 1. Asegurar conexión
    await this.connect();

    if (!this.isConnected || !this.xmppClient) {
      throw new Error('Cliente XMPP no conectado');
    }

    // 2. Construir JIDs (Jabber IDs)
    const domain = process.env.XMPP_DOMAIN || 'alejodev.cloud';
    const roomJid = `${roomName}@conference.${domain}`;
    const jibriBrewery = `jibribrewery@internal.auth.${domain}`;

    console.log('   Room JID:', roomJid);
    console.log('   Jibri Brewery:', jibriBrewery);

    // 3. Crear stanza XMPP (comando)
    const iq = xml(
      'iq',
      {
        type: 'set',                    // Tipo de stanza (set = comando)
        to: jibriBrewery,               // Destino: brewery de Jibri
        id: `jibri-start-${sessionId}`, // ID único del comando
      },
      xml(
        'jibri',
        { xmlns: 'http://jitsi.org/protocol/jibri' },
        xml('start', {
          room: roomJid,                // Sala a grabar
          session_id: sessionId,        // ID de sesión
          recording_mode: 'file',       // Modo: file (grabar a archivo)
          // Para streaming sería: recording_mode: 'stream'
        })
      )
    );

    console.log('📤 Enviando stanza XMPP:');
    console.log(iq.toString());

    // 4. Enviar comando
    await this.xmppClient.send(iq);

    console.log('✅ Comando de inicio enviado a Jibri');
    console.log('🎬 === FIN COMANDO INICIO ===\n');
  }

  /**
   * ⭐ MÉTODO PRINCIPAL: Detener grabación
   * 
   * @param sessionId - ID de la sesión de grabación que se quiere detener
   */
  async stopRecording(sessionId: string): Promise<void> {
    console.log('⏹️  === DETENIENDO GRABACIÓN ===');
    console.log('   Session ID:', sessionId);

    // 1. Asegurar conexión
    await this.connect();

    if (!this.isConnected || !this.xmppClient) {
      throw new Error('Cliente XMPP no conectado');
    }

    // 2. Construir JID de Jibri
    const domain = process.env.XMPP_DOMAIN || 'alejodev.cloud';
    const jibriBrewery = `jibribrewery@internal.auth.${domain}`;

    console.log('   Jibri Brewery:', jibriBrewery);

    // 3. Crear stanza XMPP (comando)
    const iq = xml(
      'iq',
      {
        type: 'set',
        to: jibriBrewery,
        id: `jibri-stop-${sessionId}`,
      },
      xml(
        'jibri',
        { xmlns: 'http://jitsi.org/protocol/jibri' },
        xml('stop', {
          session_id: sessionId,  // ID de sesión a detener
        })
      )
    );

    console.log('📤 Enviando stanza XMPP:');
    console.log(iq.toString());

    // 4. Enviar comando
    await this.xmppClient.send(iq);

    console.log('✅ Comando de detención enviado a Jibri');
    console.log('⏹️  === FIN COMANDO DETENCIÓN ===\n');
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.xmppClient) {
      await this.xmppClient.stop();
      this.xmppClient = null;
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('🔌 XMPP desconectado');
    }
  }
}

export const jibriXMPPService = JibriXMPPService.getInstance();
