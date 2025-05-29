import { User } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { getRepository } from 'typeorm';

export class UserService {
    private userRepository = getRepository(User);
    private activityLogRepository = getRepository(ActivityLog);

    async createUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        await this.logActivity('CREATE', user);
        return user;
    }

    async getUserById(id: number): Promise<User | undefined> {
        return this.userRepository.findOne(id);
    }

    async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
        await this.userRepository.update(id, userData);
        const updatedUser = await this.getUserById(id);
        await this.logActivity('UPDATE', updatedUser);
        return updatedUser;
    }

    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
        await this.logActivity('DELETE', { id });
    }

    private async logActivity(action: string, user: User | { id: number }): Promise<void> {
        const logEntry = this.activityLogRepository.create({
            action,
            userId: 'id' in user ? user.id : user.id,
            timestamp: new Date(),
        });
        await this.activityLogRepository.save(logEntry);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find();
    }
}