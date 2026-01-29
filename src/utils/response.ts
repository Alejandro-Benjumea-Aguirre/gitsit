export const messages = {
  required: `required`,
  stringRequired: `stringRequired`,
  numberRequired: `numberRequired`,
  string: `string`,
  number: `number`,
  email: `email`,
};

export function messageValidator(typeMessage, field) {
  const messages = {
    eequired: `${field} es requerido`,
    stringRequired: `${field} debe ser string y es requerido`,
    numberRequired: `${field} debe ser númerico y es requerido`,
    string: `${field} debe ser string`,
    number: `${field} debe ser númerico`,
    email: `${field} no es valido`,
  };

  return messages[typeMessage];
}

export function success(req, res, message, status) {
  const statusCode = status || 200;
  const statusMessage = message || '';

  res.status(statusCode).send({
    error: false,
    status: statusCode,
    body: statusMessage,
  });
}

export function error(req, res, message, status) {
  const statusCode = status || 500;
  const statusMessage = message || 'Internal server error';

  res.status(statusCode).send({
    error: true,
    status: statusCode,
    body: statusMessage,
  });
}
