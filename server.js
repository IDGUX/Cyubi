const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Cyubi System...');

// 1. Start Next.js App
const isProduction = process.env.NODE_ENV === 'production';
const nextCommand = isProduction ? 'next:start' : 'next:dev';

// 1. Start Next.js App
const nextApp = spawn('npm', ['run', nextCommand], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: 3000 }
});

// 2. Start Syslog Receiver
const syslogReceiver = spawn('node', ['scripts/syslog-receiver.js'], {
    stdio: 'inherit',
    shell: true
});

// 3. Periodic Log Maintenance (Pruning)
// Run every 6 hours
const maintenanceInterval = setInterval(async () => {
    try {
        const { pruneLogs } = require('./lib/lifecycle');
        await pruneLogs();
    } catch (e) {
        console.error('Failed to run maintenance:', e);
    }
}, 1000 * 60 * 60 * 6);

// Initial prune on start (after a short delay to let DB warm up)
setTimeout(async () => {
    try {
        const { pruneLogs } = require('./lib/lifecycle');
        await pruneLogs();
    } catch (e) { }
}, 30000);

// Handle Shutdown
const cleanup = () => {
    console.log('\n🛑 Shutting down Cyubi...');
    clearInterval(maintenanceInterval);
    nextApp.kill();
    syslogReceiver.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
