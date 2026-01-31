import type {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/response.ts';
import { jitsiConfig } from '../config/jitsi.config.ts';
import type { JitsiJWTPayload } from '../types/jitsi.types.ts';

export async function validarJWT(req: Request, res: Response) {
  //const token = req.header('x-token')
  const token = req.headers.token || '';

  if (!token) {
    return error(req, res, 'No existe token en la petición.', 401);
  }

  try {
    const decoded = jwt.verify(token, jitsiConfig.jwt.appSecret, {
      algorithms: ['HS256'],
    }) as JitsiJWTPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (e) {
    console.log(e);
    return error(req, res, 'Token no valido.', 401);
  }
}
