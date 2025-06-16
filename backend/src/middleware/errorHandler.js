"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const { statusCode = 500, message } = err;
    logger_1.logger.error(err.message, {
        statusCode,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });
    res.status(statusCode).json(Object.assign({ status: 'error', statusCode, message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : message }, (process.env.NODE_ENV !== 'production' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
