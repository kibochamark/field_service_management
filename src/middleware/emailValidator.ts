import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateEmail = [
    body('email').isEmail().normalizeEmail(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];


