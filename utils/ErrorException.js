export class ErrorException {
  constructor({ httpStatus, message, error }) {
    this.httpStatus = httpStatus;
    this.message = message;
    this.error = error;
  }
}
