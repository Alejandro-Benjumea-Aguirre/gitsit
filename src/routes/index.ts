import { Router } from 'express';
import type {Request, Response} from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathRouter = __dirname;

const removeExt = (fileName: string) => fileName.split('.').shift();

export const createRouter = async () => {
  const router = Router();
  const files = fs.readdirSync(pathRouter);

  for (const file of files) {
    const name = removeExt(file);

    if (name !== 'index') {
      const modulePath = pathToFileURL(path.join(pathRouter, file)).href;
      const route = await import(modulePath);
      router.use(`/${name}`, route.default);
    }
  }

  router.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Ruta no encontrada',
      path: req.originalUrl,
    });
  });

  return router;
};
