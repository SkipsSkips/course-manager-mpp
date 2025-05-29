import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/user.entity';

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string };
}

export const roleMiddleware = (requiredRole: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(403).json({ message: 'Access denied. No user found.' });
        }

        try {
            const userRepository = getRepository(User);
            const user = await userRepository.findOne({ where: { id: userId } });
            
            if (!user) {
                return res.status(403).json({ message: 'Access denied. User not found.' });
            }

            if (user.role !== requiredRole) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }

            next();
        } catch (error: any) {
            return res.status(500).json({ message: 'Error checking permissions', error: error.message });
        }
    };
};