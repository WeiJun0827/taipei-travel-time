export default class ErrorWithCode extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
