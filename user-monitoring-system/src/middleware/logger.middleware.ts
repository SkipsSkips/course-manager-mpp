import { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/log.service';

const logService = new LogService();

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { method, url, body, user } = req;
    const logEntry = {
        method,
        url,
        body,
        userId: user ? user.id : null,
        timestamp: new Date(),
    };

    logService.logRequest(logEntry);

    res.on('finish', () => {
        logService.logResponse({
            method,
            url,
            statusCode: res.statusCode,
            timestamp: new Date(),
        });
    });

    next();
};