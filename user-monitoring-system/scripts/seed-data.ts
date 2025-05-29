import { createConnection } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { ActivityLog } from '../src/entities/activity-log.entity';
import { MonitoredUser } from '../src/entities/monitored-user.entity';
import faker from 'faker';

async function seedDatabase() {
    const connection = await createConnection();
    
    const userRepository = connection.getRepository(User);
    const activityLogRepository = connection.getRepository(ActivityLog);
    const monitoredUserRepository = connection.getRepository(MonitoredUser);

    // Seed Users
    for (let i = 0; i < 1000; i++) {
        const user = userRepository.create({
            username: faker.internet.userName(),
            password: faker.internet.password(),
            role: faker.random.arrayElement(['user', 'admin']),
        });
        await userRepository.save(user);
    }

    const users = await userRepository.find();

    // Seed Activity Logs
    for (let i = 0; i < 1000; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const activityLog = activityLogRepository.create({
            userId: user.id,
            action: faker.random.arrayElement(['CREATE', 'READ', 'UPDATE', 'DELETE']),
            entityType: 'User',
            entityId: user.id,
        });
        await activityLogRepository.save(activityLog);
    }

    // Seed Monitored Users
    for (let i = 0; i < 100; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const monitoredUser = monitoredUserRepository.create({
            userId: user.id,
            suspiciousActivityCount: faker.datatype.number({ min: 1, max: 20 }),
            lastActivityTimestamp: faker.date.recent(),
        });
        await monitoredUserRepository.save(monitoredUser);
    }

    await connection.close();
}

seedDatabase().catch(console.error);