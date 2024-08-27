import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GlobalError } from '../types/errorTypes';
import { verifyAccessToken } from '../utils/tokens';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let error: GlobalError = new Error("");

    if (!token) {
        error.statusCode = 401;
        error.status = "unauthorized";
        return res.status(401).json({
            message: "unauthorized"
        });
    }

    try {
        const decoded_token = await verifyAccessToken(token as string);
        
        if (!decoded_token) {
            error.statusCode = 403;
            error.status = "forbidden";
            error.message = "invalid or expired token";
            return res.status(403).json({
                message: "invalid or expired token"
            });
        }

        req.user = decoded_token as any;
        next();
    } catch (err) {
        // Handle specific JWT errors
        if (err instanceof jwt.TokenExpiredError) {
            error.statusCode = 401;
            error.status = "unauthorized";
            error.message = "Token expired";
        } else if (err instanceof jwt.JsonWebTokenError) {
            error.statusCode = 403;
            error.status = "forbidden";
            error.message = "Invalid token";
        } else {
            error.statusCode = 500;
            error.status = "error";
            error.message = "Internal Server Error";
        }

        return res.status(500).json({
            message: error.message
        });
    }
};
