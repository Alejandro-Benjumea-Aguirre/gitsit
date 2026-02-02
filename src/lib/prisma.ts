import { PrismaClient, Prisma } from '@prisma/client';

// Tipos globales
declare global {
  var prisma: PrismaClient | undefined;
}

// Log levels según el entorno
const logLevels: Prisma.LogLevel[] = 
  process.env.NODE_ENV === 'developmen'
    ? ['query', 'info', 'warn', 'error']
    : ['error'];

// Crear cliente
const createPrismaClient = () => {
  return new PrismaClient({
    log: logLevels,
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });
};

// Singleton pattern
export const prisma = globalThis.prisma ?? createPrismaClient();

// En desarrollo, guardar la instancia globalmente
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Manejo de cierre graceful
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
