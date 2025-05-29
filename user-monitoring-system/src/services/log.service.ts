import { getRepository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../entities/user.entity';

export class LogService {
    async logActivity(userId: number, action: string, entity: string): Promise<void> {
        const activityLogRepository = getRepository(ActivityLog);
        const logEntry = activityLogRepository.create({
            userId,
            action,
            entity,
            timestamp: new Date(),
        });
        await activityLogRepository.save(logEntry);
    }

    async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
        const activityLogRepository = getRepository(ActivityLog);
        return await activityLogRepository.find({ where: { userId }, order: { timestamp: 'DESC' } });
    }

    async getAllActivityLogs(): Promise<ActivityLog[]> {
        const activityLogRepository = getRepository(ActivityLog);
        return await activityLogRepository.find({ order: { timestamp: 'DESC' } });
    }
}