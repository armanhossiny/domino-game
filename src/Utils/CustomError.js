class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.isOperational = true;
  }
}

module.exports = {
  ValidationError
};
