import { parentPort } from 'worker_threads';
import { createConnection, getRepository } from 'typeorm';
import { MonitoringService } from '../services/monitoring.service';
import { LogService } from '../services/log.service';
import { ActivityLog } from '../entities/activity-log.entity';
import { MonitoredUser } from '../entities/monitored-user.entity';
import { User } from '../entities/user.entity';

// Initialize database connection first
async function initializeWorker() {
    try {
        const connection = await createConnection({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASS || 'postgres',
            database: process.env.DB_NAME || 'mpp',
            entities: [ActivityLog, MonitoredUser, User],
            synchronize: false,
            logging: false,
        });
        console.log('Worker database connection established');

        // Get repositories
        const activityLogRepository = getRepository(ActivityLog);
        const monitoredUserRepository = getRepository(MonitoredUser);
        const userRepository = getRepository(User);

        // Initialize services with repositories
        const monitoringService = new MonitoringService(
            activityLogRepository,
            monitoredUserRepository,
            userRepository
        );
        const logService = new LogService();

        // The monitoring activity function
        async function monitorActivity() {
            try {
                // Get all monitored users (as a stand-in for "suspicious" users)
                const monitoredUsers = await monitoringService.getMonitoredUsers();
                if (monitoredUsers.length > 0) {
                    // Log a summary for each monitored user
                    for (const monitoredUser of monitoredUsers) {
                        await logService.logActivity(
                            monitoredUser.userId,
                            'SUSPICIOUS_ACTIVITY',
                            'MonitoredUser'
                        );
                    }

                    // Send results back to main thread
                    parentPort?.postMessage({
                        type: 'monitoring_results',
                        data: monitoredUsers
                    });
                }
            } catch (error: any) {
                console.error('Error monitoring user activity:', error);
                parentPort?.postMessage({
                    type: 'error',
                    data: { message: error.message, stack: error.stack }
                });
            }
        }

        // Run monitoring at intervals
        setInterval(monitorActivity, 60000); // Check every minute

        // Respond to messages from parent thread
        parentPort?.on('message', (message) => {
            if (message === 'run_now') {
                monitorActivity();
            }
        });

    } catch (error: any) {
        console.error('Worker initialization failed:', error);
        process.exit(1);
    }
}

// Start the worker
initializeWorker();