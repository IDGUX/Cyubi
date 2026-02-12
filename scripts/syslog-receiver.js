const dgram = require('dgram');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let syslogPort = 514;
let syslogEnabled = false;
let usbEnabled = false;
let usbPath = "";
let apiUrl = 'http://127.0.0.1:3000/api/logs';
let settingsUrl = 'http://127.0.0.1:3000/api/settings';

function syncToUsb(msg) {
    if (!usbEnabled || !usbPath) return;

    try {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${msg}\n`;

        // Ensure directory exists
        const dir = path.dirname(usbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Forensic-grade write: Append + Flush to physical media
        // We open, write, fsync and close every time to ensure the OS 
        // doesn't keep it in volatile memory in case of power loss.
        const fd = fs.openSync(usbPath, 'a');
        fs.appendFileSync(fd, logLine);
        fs.fsyncSync(fd);
        fs.closeSync(fd);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(`❌ [USB ERROR] Failed to sync to ${usbPath}: ${e.message}`);
        }
    }
}

function logToDisk(msg) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(msg);
    }
}

const VERSION = "1.2.0-BLACKBOX";
logToDisk(`🛰️ Cyubi Syslog Receiver started (v${VERSION})`);

let server = null;
let sources = [];

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

        // USB Blackbox Settings
        usbEnabled = data.USB_AUTO_SYNC === 'true';
        usbPath = data.USB_PATH || "";

        if (newPort === 514) {
            logToDisk("⚠️ Port 514 requested, but using 5140 for Docker compatibility.");
            newPort = 5140;
        }

        if (newEnabled !== syslogEnabled || newPort !== syslogPort) {
            logToDisk(`Config change: Enabled=${newEnabled}, Port=${newPort}`);
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
            }
        } catch (e) { }
    } catch (error) {
        logToDisk(`❌ [CONFIG ERROR] ${error.message}`);
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
        logToDisk(`Syslog Receiver error: ${err.message}`);
        stopServer();
    });

    server.on('message', async (msg, rinfo) => {
        const content = msg.toString();
        logToDisk(`📥 [REC] ${rinfo.address}: ${content.substring(0, 50)}...`);

        // MIRROR TO BLACKBOX (USB) - Done BEFORE API call for maximum reliability
        syncToUsb(`[${rinfo.address}] ${content}`);

        try {
            const sourcesList = Array.isArray(sources) ? sources : [];
            const foundSource = sourcesList.find(s => s.ipAddress === rinfo.address);
            const sourceName = foundSource ? foundSource.name : rinfo.address;

            await axios.post(apiUrl, {
                level: 'INFO',
                source: sourceName,
                message: content,
                ipAddress: rinfo.address,
                hostname: foundSource ? foundSource.name : 'Syslog-Device'
            }, {
                headers: { 'x-internal-key': process.env.JWT_SECRET || "dev-secret-key" }
            });
        } catch (error) {
            logToDisk(`❌ [API ERR] ${rinfo.address}: ${error.message}`);
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
    if (syslogEnabled) startServer();
}

fetchConfig().then(() => {
    if (syslogEnabled) startServer();
});

setInterval(fetchConfig, 10000);
