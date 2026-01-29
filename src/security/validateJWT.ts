import jwt from 'jsonwebtoken';
import { error } from '../utils/response.ts';

export async function validarJWT(req, res, next) {
  //const token = req.header('x-token')
  const token = req.cookies.access_token;

  if (!token) {
    return error(req, res, 'No existe token en la petición.', 401);
  }

  try {
    const { uid } = await jwt.verify(token, process.env.SECRETORPRIVATEDKEY);

    const user = await repositorieUser.listById(uid);

    if (!user) {
      return error(req, res, 'Token no valido - usuario no existe.', 401);
    }

    // Verificar si el user tiene estado true
    if (user.state_id != 1) {
      return error(req, res, 'Token no valido - usuario inactivo', 401);
    }

    req.usuario = user;

    return next();
  } catch (error) {
    console.log(error);
    return error(req, res, 'Token no valido.', 401);
  }
}
