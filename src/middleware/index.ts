import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GlobalError } from '../types/errorTypes';
import { verifyAccessToken } from '../utils/tokens';

export const authenticateToken = async(req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let error: GlobalError = new Error("")

    if (token == null) {
        error.statusCode = 401
        error.status = "unauthorized"
        return next(error)
    };


    const decoded_token = verifyAccessToken(token as string)
    console.log(decoded_token)

    if (!decoded_token) {
        error.statusCode = 403
        error.status = "forbidden"
        error.message="invalid or expired token"
        return next(error)
    }

    req.user = decoded_token as any
    return next()
};
