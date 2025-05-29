import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';

// Always use the compiled JS file for worker threads
const workerPath = path.resolve(__dirname, 'worker-script.js');

if (!fs.existsSync(workerPath)) {
  throw new Error(`Worker script not found at ${workerPath}. Please compile TypeScript first.`);
}

let activityMonitorWorker: Worker | undefined;

try {
  activityMonitorWorker = new Worker(workerPath);

  activityMonitorWorker.on('message', (message) => {
    if (message.type === 'monitoring_results') {
      console.log(`Monitoring detected ${message.data.length} suspicious users`);
    } else if (message.type === 'error') {
      console.error('Worker reported an error:', message.data);
    }
  });

  activityMonitorWorker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  activityMonitorWorker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });

  console.log('User activity monitoring worker started successfully');

} catch (error) {
  console.error('Failed to start worker:', error);
}

export default activityMonitorWorker;