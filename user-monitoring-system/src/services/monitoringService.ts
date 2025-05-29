import { Op } from 'sequelize';
import { ActivityLog, User, UserActivitySummary } from '../config/database';

const MONITORING_INTERVAL = 30 * 1000; // 30 seconds for testing
const SUSPICIOUS_THRESHOLDS = {
  CREATE: 20,  // More than 20 creates per day
  UPDATE: 30,  // More than 30 updates per day
  DELETE: 10,  // More than 10 deletes per day
  TOTAL: 100   // More than 100 total actions per day
};

let monitoringIntervalId: NodeJS.Timeout;

export function startMonitoringThread(): void {
  console.log('Starting user activity monitoring thread...');
  
  monitoringIntervalId = setInterval(async () => {
    try {
      await analyzeUserActivity();
    } catch (error) {
      console.error('Error in monitoring thread:', error);
    }
  }, MONITORING_INTERVAL);
}

export function stopMonitoringThread(): void {
  if (monitoringIntervalId) {
    clearInterval(monitoringIntervalId);
    console.log('Monitoring thread stopped');
  }
}

async function analyzeUserActivity(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  console.log(`🔍 Analyzing user activity for ${today}...`);
  
  // Get all users
  const users = await User.findAll({ where: { isActive: true } });
  
  for (const user of users) {
    await analyzeUserDailyActivity(user, today);
  }
  
  // Clean up old summaries (keep only last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await UserActivitySummary.destroy({
    where: {
      date: { [Op.lt]: thirtyDaysAgo }
    }
  });
}

async function analyzeUserDailyActivity(user: User, date: string): Promise<void> {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);
  
  // Get activity counts for the day
  const activities = await ActivityLog.findAll({
    where: {
      userId: user.id,
      timestamp: {
        [Op.between]: [startOfDay, endOfDay]
      }
    }
  });
  
  const counts = {
    CREATE: 0,
    READ: 0,
    UPDATE: 0,
    DELETE: 0,
    total: activities.length
  };
  
  activities.forEach(activity => {
    if (counts.hasOwnProperty(activity.action)) {
      counts[activity.action as keyof typeof counts]++;
    }
  });
  
  // Calculate suspicious score
  let suspiciousScore = 0;
  if (counts.CREATE > SUSPICIOUS_THRESHOLDS.CREATE) suspiciousScore += 1;
  if (counts.UPDATE > SUSPICIOUS_THRESHOLDS.UPDATE) suspiciousScore += 1;
  if (counts.DELETE > SUSPICIOUS_THRESHOLDS.DELETE) suspiciousScore += 1;
  if (counts.total > SUSPICIOUS_THRESHOLDS.TOTAL) suspiciousScore += 2;
  
  // Create or update activity summary
  await UserActivitySummary.upsert({
    userId: user.id,
    date,
    createActions: counts.CREATE,
    readActions: counts.READ,
    updateActions: counts.UPDATE,
    deleteActions: counts.DELETE,
    totalActions: counts.total,
    suspiciousScore
  });
  
  // Flag user as monitored if suspicious
  const shouldBeMonitored = suspiciousScore >= 2;
  
  if (shouldBeMonitored && !user.isMonitored) {
    await user.update({
      isMonitored: true,
      monitoredSince: new Date()
    });
    console.log(`🚨 User ${user.username} flagged for monitoring (score: ${suspiciousScore})`);
  } else if (!shouldBeMonitored && user.isMonitored) {
    // Check if user has been clean for 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentSuspiciousActivity = await UserActivitySummary.findOne({
      where: {
        userId: user.id,
        date: { [Op.gte]: threeDaysAgo },
        suspiciousScore: { [Op.gte]: 2 }
      }
    });
    
    if (!recentSuspiciousActivity) {
      await user.update({
        isMonitored: false,
        monitoredSince: null
      });
      console.log(`✅ User ${user.username} removed from monitoring`);
    }
  }
  
  if (counts.total > 0) {
    console.log(`User ${user.username}: ${counts.total} actions (C:${counts.CREATE}, R:${counts.READ}, U:${counts.UPDATE}, D:${counts.DELETE}, Score:${suspiciousScore})`);
  }
}

export async function getMonitoredUsers(): Promise<User[]> {
  return User.findAll({
    where: { isMonitored: true },
    attributes: ['id', 'username', 'email', 'monitoredSince'],
    include: [{
      model: UserActivitySummary,
      where: {
        date: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      },
      required: false
    }]
  });
}
