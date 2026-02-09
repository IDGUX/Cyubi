const dgram = require('dgram');
const axios = require('axios');

let syslogPort = 514;
let syslogEnabled = false;
let apiUrl = 'http://127.0.0.1:3000/api/logs';
let settingsUrl = 'http://127.0.0.1:3000/api/settings';

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../public/receiver.txt');

function logToDisk(msg) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(msg);
    }
}

const VERSION = "1.1.0-FIX-PORT";
logToDisk(`🛰️ Syslog Receiver process started (v${VERSION})`);

let server = null;
let sources = []; // List of SyslogSource from DB

async function fetchConfig() {
    try {
        logToDisk(`Fetching config from ${settingsUrl}...`);
        const response = await axios.get(settingsUrl, {
            timeout: 3000,
            headers: { 'x-internal-key': process.env.JWT_SECRET || "dev-secret-key" }
        });

        const data = response.data;
        const newEnabled = data.SYSLOG_ENABLED === 'true';
        let newPort = parseInt(data.SYSLOG_PORT) || 514;

        // CRITICAL FIX: Non-root user in Docker cannot bind to port 514.
        // We use 5140 internally and map host 514 to it.
        if (newPort === 514) {
            logToDisk("⚠️ Port 514 requested, but using 5140 for Docker non-root compatibility.");
            newPort = 5140;
        }

        if (newEnabled !== syslogEnabled || newPort !== syslogPort) {
            logToDisk(`Config change detected: Enabled=${newEnabled}, Port=${newPort}`);
            syslogEnabled = newEnabled;
            syslogPort = newPort;
            restartServer();
        }

        // Fetch Sources
        try {
            const apiBase = settingsUrl.replace('/settings', '');
            const sourcesRes = await axios.get(`${apiBase}/sources`, { timeout: 2000 });
            if (Array.isArray(sourcesRes.data)) {
                sources = sourcesRes.data;
                // console.log(`Loaded ${sources.length} syslog sources`);
            } else {
                console.warn('⚠️ Sources API returned non-array data:', typeof sourcesRes.data);
                sources = [];
            }
        } catch (e) {
            // Silently fail if sources API not ready
        }
    } catch (error) {
        logToDisk(`❌ [CONFIG ERROR] Failed to fetch config: ${error.message}`);
        if (error.response) {
            logToDisk(`   Status: ${error.response.status} - Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
        }
    }
}

function stopServer() {
    if (server) {
        logToDisk('Stopping Syslog server...');
        server.close();
        server = null;
    }
}

function startServer() {
    if (!syslogEnabled) return;

    logToDisk(`Starting Syslog server on port ${syslogPort}...`);
    server = dgram.createSocket('udp4');

    server.on('error', (err) => {
        logToDisk(`Syslog Receiver error:\n${err.stack}`);
        stopServer();
    });

    server.on('message', async (msg, rinfo) => {
        const content = msg.toString();
        // Always log reception
        logToDisk(`📥 [RECEIVE] From ${rinfo.address}:${rinfo.port}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);

        try {
            // Try to find a friendly name for this source
            const sourcesList = Array.isArray(sources) ? sources : [];
            const foundSource = sourcesList.find(s => s.ipAddress === rinfo.address);
            const sourceName = foundSource ? foundSource.name : rinfo.address;

            if (!foundSource) {
                console.log(`ℹ️ [MAPPING] No saved device found for ${rinfo.address}. Using raw IP.`);
            }

            const res = await axios.post(apiUrl, {
                level: 'INFO',
                source: sourceName,
                message: content,
                ipAddress: rinfo.address,
                hostname: foundSource ? foundSource.name : 'Syslog-Device'
            }, {
                headers: { 'x-internal-key': process.env.JWT_SECRET || "dev-secret-key" }
            });
            logToDisk(`🚀 [FORWARD] Forwarded to API. Status: ${res.status}`);
        } catch (error) {
            logToDisk(`❌ [ERROR] Failed to forward syslog from ${rinfo.address}: ${error.message}`);
            if (error.response) {
                logToDisk(`   API Error Detail: ${JSON.stringify(error.response.data)}`);
            }
        }
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`Syslog Receiver listening on ${address.address}:${address.port}`);
    });

    try {
        server.bind(syslogPort);
    } catch (e) {
        console.error(`Failed to bind to port ${syslogPort}:`, e.message);
    }
}

function restartServer() {
    stopServer();
    if (syslogEnabled) {
        startServer();
    }
}

// Initial fetch and start
fetchConfig().then(() => {
    if (syslogEnabled) startServer();
});

// Periodic check for config changes (every 10 seconds)
setInterval(fetchConfig, 10000);
