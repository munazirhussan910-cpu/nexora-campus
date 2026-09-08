"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred';
    if (statusCode === 500) {
        console.error('Server 500 error:', err);
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        },
    });
};
exports.errorHandler = errorHandler;
