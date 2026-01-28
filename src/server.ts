import 'dotenv/config';


import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Conexion
import prisma from '../lib/prisma.ts';
// Rutas
import {createRouter} from '../routes/index.ts';


export class Server {
  private app: ReturnType<typeof express>;
  private port: number;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 8000;

    this.dbConnection();
    this.middlewares();
    this.routes();
    this.rateLimiter();
  }

  private async dbConnection() {
    try {
      await prisma.$connect();
      console.log('✅ Prisma conectado a PostgreSQL');
    } catch (error) {
      console.error('❌ Error conectando Prisma:', error);
      process.exit(1);
    }
  }

  private middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  private rateLimiter() {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.',
    });

    this.app.use(limiter);
  }

  private async routes () {
    this.app.use('/api', await createRouter());
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor corriendo en puerto ${this.port}`);
    });
  }
}


const server = new Server();
server.listen();