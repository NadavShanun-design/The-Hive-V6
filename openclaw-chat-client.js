// OpenClaw Gateway Chat Client
// Rewritten to follow exact protocol from openclaw/src/gateway/client.ts

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class OpenClawChatClient extends EventEmitter {
    constructor(gatewayUrl = 'ws://127.0.0.1:18789', token = null) {
        super();
        this.gatewayUrl = gatewayUrl;
        this.token = token;
        this.ws = null;
        this.connected = false;
        this.pending = new Map();
        this.sessionKey = 'default';
        this.connectNonce = null;
        this.connectSent = false;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.PROTOCOL_VERSION = 3;
    }

    connect() {
        console.log(`🦞 Connecting to OpenClaw gateway at ${this.gatewayUrl}...`);

        this.ws = new WebSocket(this.gatewayUrl, {
            headers: {
                'Origin': 'http://localhost:3002'
            },
            maxPayload: 25 * 1024 * 1024
        });

        this.ws.on('open', () => {
            console.log('✅ OpenClaw WebSocket connected, waiting for connect.challenge...');
            this.queueConnect();
        });

        this.ws.on('message', (data) => {
            try {
                const raw = data.toString();
                console.log('📩 Received frame:', raw.substring(0, 200));
                const frame = JSON.parse(raw);
                this.handleMessage(frame);
            } catch (err) {
                console.error('Failed to parse OpenClaw message:', err);
            }
        });

        this.ws.on('close', (code, reason) => {
            console.log(`❌ OpenClaw WebSocket closed (${code}): ${reason}`);
            this.connected = false;
            this.emit('disconnected');

            // Flush pending promises
            for (const [id, pending] of this.pending.entries()) {
                pending.reject(new Error(`Connection closed (${code})`));
            }
            this.pending.clear();

            this.scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            console.error('OpenClaw WebSocket error:', err.message);
        });
    }

    queueConnect() {
        // Reset connection state
        this.connectNonce = null;
        this.connectSent = false;

        // Wait 750ms for connect.challenge, then send connect anyway
        setTimeout(() => {
            if (!this.connectSent) {
                console.log('⏰ No connect.challenge after 750ms, sending connect...');
                this.sendConnect();
            }
        }, 750);
    }

    handleMessage(frame) {
        // Handle event frames
        if (frame.type === 'event') {
            this.handleEvent(frame);
            return;
        }

        // Handle response frames
        if (frame.type === 'res') {
            this.handleResponse(frame);
            return;
        }

        console.log('⚠️ Unknown frame type:', frame.type);
    }

    handleEvent(evt) {
        console.log('📡 Event:', evt.event);

        // Handle connect.challenge - CRITICAL for protocol flow
        if (evt.event === 'connect.challenge') {
            const nonce = evt.payload?.nonce;
            if (nonce) {
                console.log('🔐 Received connect challenge with nonce:', nonce.substring(0, 16) + '...');
                this.connectNonce = nonce;
                this.sendConnect();
            } else {
                console.log('⚠️ connect.challenge missing nonce, sending connect anyway');
                this.sendConnect();
            }
            return;
        }

        // Handle chat events
        if (evt.event === 'chat') {
            console.log('💬 Chat event:', evt.payload);
            this.emit('chat.event', evt.payload);
        }

        // Other events
        this.emit('event', evt);
    }

    handleResponse(res) {
        console.log('📬 Response for request:', res.id, 'ok:', res.ok);

        const pending = this.pending.get(res.id);
        if (pending) {
            this.pending.delete(res.id);
            if (res.ok) {
                pending.resolve(res.payload);
            } else {
                const errMsg = res.error?.message || 'Request failed';
                console.error('❌ Request failed:', errMsg);
                pending.reject(new Error(errMsg));
            }
        }

        // Special handling for connect response (hello-ok)
        if (res.payload?.type === 'hello-ok') {
            this.connected = true;
            this.reconnectDelay = 1000; // Reset backoff
            const protocol = res.payload.protocol || this.PROTOCOL_VERSION;
            console.log('✅ Connected to OpenClaw gateway (protocol', protocol, ')');
            console.log('🎯 Gateway capabilities:', res.payload.caps);
            console.log('🔐 Granted scopes:', JSON.stringify(res.payload.scopes));
            console.log('📋 Full hello-ok payload:', JSON.stringify(res.payload));
            this.grantedScopes = res.payload.scopes || [];
            this.emit('connected', res.payload);
        }
    }

    sendConnect() {
        if (this.connectSent) {
            console.log('⚠️ Connect already sent, skipping duplicate');
            return;
        }

        this.connectSent = true;
        console.log('🔌 Sending connect request...');

        // Build connect params following openclaw/src/gateway/client.ts pattern
        const params = {
            minProtocol: this.PROTOCOL_VERSION,
            maxProtocol: this.PROTOCOL_VERSION,
            client: {
                id: 'cli',  // Valid OpenClaw client ID from GATEWAY_CLIENT_IDS
                version: '1.0.0',
                platform: 'node',
                mode: 'cli'  // CLI mode has write access
            },
            role: 'operator',
            scopes: ['operator.read', 'operator.write', 'operator.admin', 'operator.approvals', 'operator.pairing']
        };

        // Only include auth if token is provided
        if (this.token) {
            params.auth = { token: this.token };
        }

        // Include nonce if we received one (optional but recommended)
        if (this.connectNonce) {
            console.log('🔐 Including nonce in connect request');
            // Note: For control-ui mode, device signature is optional
            // We're relying on token auth only
        }

        console.log('📤 Connect params:', JSON.stringify(params, null, 2));

        this.request('connect', params).catch(err => {
            console.error('💥 Connect failed:', err.message);
            this.ws?.close();
        });
    }

    request(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = this.generateId();
            const frame = {
                type: 'req',
                id,
                method,
                params
            };

            this.pending.set(id, { resolve, reject });

            console.log('📤 Sending request:', method, 'id:', id);

            // Timeout after 30s
            setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);

            this.ws.send(JSON.stringify(frame));
        });
    }

    async sendMessage(message, sessionKey = null) {
        if (!this.connected) {
            throw new Error('Not connected to OpenClaw gateway');
        }

        const key = sessionKey || this.sessionKey;
        const idempotencyKey = this.generateId();

        console.log('💬 Sending message to session:', key);

        return this.request('chat.send', {
            sessionKey: key,
            message: message.trim(),
            deliver: false, // Don't deliver to external channels
            idempotencyKey
        });
    }

    async getHistory(sessionKey = null, limit = 50) {
        if (!this.connected) {
            throw new Error('Not connected to OpenClaw gateway');
        }

        const key = sessionKey || this.sessionKey;

        return this.request('chat.history', {
            sessionKey: key,
            limit
        });
    }

    async abortChat(sessionKey = null, runId = null) {
        if (!this.connected) {
            throw new Error('Not connected to OpenClaw gateway');
        }

        const key = sessionKey || this.sessionKey;
        const params = { sessionKey: key };
        if (runId) {
            params.runId = runId;
        }

        return this.request('chat.abort', params);
    }

    async captureScreen() {
        if (!this.connected) {
            throw new Error('Not connected to OpenClaw gateway');
        }

        console.log('📸 Requesting screen capture via browser.request...');
        return this.request('browser.request', {
            action: 'screenshot',
            target: 'desktop'
        });
    }

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    scheduleReconnect() {
        setTimeout(() => {
            console.log('🔄 Reconnecting to OpenClaw gateway...');
            this.connect();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(
            this.reconnectDelay * 1.5,
            this.maxReconnectDelay
        );
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}

module.exports = OpenClawChatClient;
