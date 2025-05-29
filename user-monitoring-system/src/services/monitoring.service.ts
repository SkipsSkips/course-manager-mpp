import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { MonitoredUser } from '../entities/monitored-user.entity';

@Injectable()
export class MonitoringService {
    constructor(
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
        @InjectRepository(MonitoredUser)
        private readonly monitoredUserRepository: Repository<MonitoredUser>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async logUserActivity(userId: number, action: string): Promise<void> {
        const logEntry = this.activityLogRepository.create({ userId, action });
        await this.activityLogRepository.save(logEntry);
        this.checkSuspiciousActivity(userId);
    }

    private async checkSuspiciousActivity(userId: number): Promise<void> {
        const logs = await this.activityLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 100,
        });

        const actionCounts = this.countActions(logs);
        if (this.isSuspicious(actionCounts)) {
            await this.monitorUser(userId);
        }
    }

    private countActions(logs: ActivityLog[]): Record<string, number> {
        return logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
    }

    private isSuspicious(actionCounts: Record<string, number>): boolean {
        // Define your logic to determine if the activity is suspicious
        return Object.values(actionCounts).some(count => count > 10); // Example threshold
    }

    private async monitorUser(userId: number): Promise<void> {
        const monitoredUser = await this.monitoredUserRepository.findOne({ where: { userId } });
        if (!monitoredUser) {
            const newMonitoredUser = this.monitoredUserRepository.create({ userId });
            await this.monitoredUserRepository.save(newMonitoredUser);
        }
    }

    async getMonitoredUsers(): Promise<MonitoredUser[]> {
        return this.monitoredUserRepository.find({ relations: ['user'] });
    }
}