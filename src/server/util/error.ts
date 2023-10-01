export default class ErrorWithStatusCode extends Error {

  readonly statusCode: number;

  constructor(statusCode: number, message = '') {
    super(message);
    this.statusCode = statusCode;
  }
}
