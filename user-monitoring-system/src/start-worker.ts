import './workers/activity-monitor.worker';

// Keep process alive if needed
setInterval(() => {}, 1 << 30);