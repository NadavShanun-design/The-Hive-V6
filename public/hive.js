// THE HIVE - Multi-Agent Terminal Orchestration System
// WebSocket + xterm.js client for 6 terminals + MOLTBOT

const WS_URL = window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;

const terminals = new Map();
const fitAddons = new Map();
const sockets = new Map();

// All 6 agent IDs
const AGENTS = [
    'project1-master',
    'project1-coder',
    'project2-master',
    'project2-coder',
    'project3-master',
    'project3-coder'
];

// Terminal number mapping (T1-T7)
// Use: TERMINAL_MAP[1] => 'project1-master', TERMINAL_MAP_REVERSE['project1-master'] => 1
const TERMINAL_MAP = {
    1: 'project1-master',   // T1 - Project 1 Master
    2: 'project1-coder',    // T2 - Project 1 Coder
    3: 'project2-master',   // T3 - Project 2 Master
    4: 'project2-coder',    // T4 - Project 2 Coder
    5: 'project3-master',   // T5 - Project 3 Master
    6: 'project3-coder',    // T6 - Project 3 Coder
    7: 'moltbot'            // T7 - OpenClaw Chat / MOLTBOT
};

const TERMINAL_MAP_REVERSE = Object.fromEntries(
    Object.entries(TERMINAL_MAP).map(([k, v]) => [v, parseInt(k)])
);

// Initialize all terminals
function initializeTerminals() {
    AGENTS.forEach(agentId => {
        const container = document.getElementById(`terminal-${agentId}`);
        if (!container) {
            console.error(`Container not found for ${agentId}`);
            return;
        }

        // Create xterm.js instance
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            theme: {
                background: '#050505',
                foreground: '#e0e0e0',
                cursor: '#00ff41',
                black: '#0a0a0a',
                red: '#ff006e',
                green: '#00ff41',
                yellow: '#ffbe0b',
                blue: '#00d4ff',
                magenta: '#ff006e',
                cyan: '#00d4ff',
                white: '#e0e0e0',
                brightBlack: '#666666',
                brightRed: '#ff006e',
                brightGreen: '#00ff41',
                brightYellow: '#ffbe0b',
                brightBlue: '#00d4ff',
                brightMagenta: '#ff006e',
                brightCyan: '#00d4ff',
                brightWhite: '#ffffff'
            },
            allowTransparency: true,
            scrollback: 10000
        });

        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(container);
        fitAddon.fit();

        terminals.set(agentId, term);
        fitAddons.set(agentId, fitAddon);

        // Connect to WebSocket
        connectTerminal(agentId, term, fitAddon);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        fitAddons.forEach(fitAddon => fitAddon.fit());
    });

    updateTerminalCount();
}

// Connect a terminal to its WebSocket
function connectTerminal(agentId, term, fitAddon) {
    const ws = new WebSocket(`${WS_URL}?agent=${agentId}`);

    ws.addEventListener('open', () => {
        console.log(`✅ Connected: ${agentId}`);
        updateStatus(agentId, 'Connected');
        updateTerminalCount();

        // Send initial resize
        const { cols, rows } = term;
        ws.send(JSON.stringify({
            type: 'resize',
            cols,
            rows
        }));
    });

    ws.addEventListener('message', (event) => {
        try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'output') {
                term.write(msg.data);
            } else if (msg.type === 'directory_changed') {
                console.log(`[FOLDER] Directory changed for ${agentId}: ${msg.path}`);
                if (msg.success) {
                    updateTerminalCwd(agentId, msg.path);
                }
            }
        } catch (error) {
            console.error(`Error handling message for ${agentId}:`, error);
        }
    });

    ws.addEventListener('close', () => {
        console.log(`❌ Disconnected: ${agentId}`);
        updateStatus(agentId, 'Disconnected');
        updateTerminalCount();

        // Attempt reconnection after 3 seconds
        setTimeout(() => {
            console.log(`🔄 Reconnecting: ${agentId}`);
            connectTerminal(agentId, term, fitAddon);
        }, 3000);
    });

    ws.addEventListener('error', (error) => {
        console.error(`WebSocket error for ${agentId}:`, error);
        updateStatus(agentId, 'Error');
    });

    // Handle user input
    term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'input',
                data
            }));
        }
    });

    // Handle terminal resize
    term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'resize',
                cols,
                rows
            }));
        }
    });

    sockets.set(agentId, ws);
}

// Update terminal status indicator
function updateStatus(agentId, status) {
    const statusEl = document.getElementById(`status-${agentId}`);
    if (statusEl) {
        statusEl.textContent = status;
    }
}

// Update terminal count in header
function updateTerminalCount() {
    const connectedCount = Array.from(sockets.values())
        .filter(ws => ws.readyState === WebSocket.OPEN)
        .length;
    const totalCount = sockets.size;

    const countEl = document.getElementById('terminal-count');
    if (countEl) {
        countEl.textContent = `${connectedCount}/${totalCount} terminals`;
    }

    // Update dynamic terminal count badge
    const dynCount = dynamicTerminalCount;
    const dynCountEl = document.getElementById('dynamic-terminal-count');
    if (dynCountEl) {
        dynCountEl.textContent = dynCount === 0 ? '0 terminals' : `${dynCount} terminal${dynCount === 1 ? '' : 's'}`;
    }
}

// ===== DYNAMIC TERMINALS =====

const MAX_EXTRA_TERMINALS = 30;
let extraTerminalSlot = 0;    // next slot to reveal (1-indexed, 0 = none revealed yet)
let dynamicTerminalCount = 0; // current open count, for display badge

const TERMINAL_THEME = {
    background: '#050505',
    foreground: '#e0e0e0',
    cursor: '#00ff41',
    black: '#0a0a0a',
    red: '#ff006e',
    green: '#00ff41',
    yellow: '#ffbe0b',
    blue: '#00d4ff',
    magenta: '#ff006e',
    cyan: '#00d4ff',
    white: '#e0e0e0',
    brightBlack: '#666666',
    brightRed: '#ff006e',
    brightGreen: '#00ff41',
    brightYellow: '#ffbe0b',
    brightBlue: '#00d4ff',
    brightMagenta: '#ff006e',
    brightCyan: '#00d4ff',
    brightWhite: '#ffffff'
};

function addNewTerminal() {
    if (extraTerminalSlot >= MAX_EXTRA_TERMINALS) {
        console.log('[HIVE] Max extra terminals reached (30)');
        return;
    }

    extraTerminalSlot++;
    dynamicTerminalCount++;

    // These IDs match exactly what the server pre-configured
    const agentId = `extra-${extraTerminalSlot}`;
    const termNumber = 6 + extraTerminalSlot; // T7, T8, T9 ...

    const grid = document.getElementById('dynamic-terminals-grid');
    const addBtn = document.getElementById('add-terminal-btn');

    // Build the terminal wrapper element
    const wrapper = document.createElement('div');
    wrapper.className = 'dynamic-terminal-wrapper';
    wrapper.id = `wrapper-${agentId}`;
    wrapper.innerHTML = `
        <div class="dynamic-terminal-title">
            <span style="display:flex;align-items:center;gap:6px;">
                <span style="background:#333;color:#ccc;font-size:0.7rem;padding:2px 7px;border-radius:3px;letter-spacing:1px;">T${termNumber}</span>
                <input type="text" class="terminal-label" placeholder="label..." style="font-size:0.75rem;width:90px;" />
            </span>
            <span style="display:flex;align-items:center;gap:8px;">
                <span class="terminal-status" id="status-${agentId}" style="font-size:0.7rem;color:var(--text-tertiary);">Connecting...</span>
                <button class="dynamic-close-btn" onclick="hideTerminal('${agentId}')" title="Hide terminal">✕</button>
            </span>
        </div>
        <div class="dynamic-terminal-body" id="terminal-${agentId}"></div>
    `;

    // Insert before the + button
    grid.insertBefore(wrapper, addBtn);

    // Hide the + button if we've reached max
    if (extraTerminalSlot >= MAX_EXTRA_TERMINALS) {
        addBtn.style.display = 'none';
    }

    // Create xterm.js instance
    const term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
        theme: TERMINAL_THEME,
        allowTransparency: true,
        scrollback: 5000
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    const container = document.getElementById(`terminal-${agentId}`);
    term.open(container);

    // Fit after a brief delay to let DOM settle
    requestAnimationFrame(() => {
        fitAddon.fit();
    });

    terminals.set(agentId, term);
    fitAddons.set(agentId, fitAddon);

    connectTerminal(agentId, term, fitAddon);

    // Add to "send to" dropdown
    addTerminalToDropdown(agentId, termNumber);

    updateTerminalCount();

    // Scroll to the new terminal
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide a terminal from view (keeps the slot reserved on the server side)
function hideTerminal(agentId) {
    const wrapper = document.getElementById(`wrapper-${agentId}`);
    if (wrapper) wrapper.remove();

    dynamicTerminalCount = Math.max(0, dynamicTerminalCount - 1);

    // Show the + button again if it was hidden
    const addBtn = document.getElementById('add-terminal-btn');
    if (addBtn) addBtn.style.display = '';

    updateTerminalCount();
    removeTerminalFromDropdown(agentId);
}

// Keep closeTerminal() as alias for compatibility
function closeTerminal(agentId) {
    hideTerminal(agentId);
}

// Add an extra terminal to the quick-ideas "send to" dropdown
function addTerminalToDropdown(agentId, termNumber) {
    const select = document.getElementById('idea-target');
    if (!select) return;
    // Don't add duplicates
    if (select.querySelector(`option[value="${agentId}"]`)) return;

    const option = document.createElement('option');
    option.value = agentId;
    option.textContent = `T${termNumber} - Agent ${agentId}`;
    // Insert before the Queen option
    const queenOption = select.querySelector('option[value="moltbot"]');
    if (queenOption) {
        select.insertBefore(option, queenOption);
    } else {
        select.appendChild(option);
    }
}

// Remove a terminal from the dropdown
function removeTerminalFromDropdown(agentId) {
    const select = document.getElementById('idea-target');
    if (!select) return;
    const opt = select.querySelector(`option[value="${agentId}"]`);
    if (opt) opt.remove();
}

function closeTerminal(agentId) {
    // Close WebSocket
    const ws = sockets.get(agentId);
    if (ws) {
        ws.close();
        sockets.delete(agentId);
    }

    // Dispose xterm instance
    const term = terminals.get(agentId);
    if (term) {
        term.dispose();
        terminals.delete(agentId);
    }

    fitAddons.delete(agentId);

    // Remove DOM element
    const wrapper = document.getElementById(`wrapper-${agentId}`);
    if (wrapper) wrapper.remove();

    // Decrement the visible count (IDs keep incrementing via dynamicTerminalIdCounter)
    dynamicTerminalCount = Math.max(0, dynamicTerminalCount - 1);
    updateTerminalCount();
}

// ===== QUICK IDEAS =====

async function saveQuickIdea() {
    const input = document.getElementById('quick-idea-input');
    const target = document.getElementById('idea-target');
    const content = input.value.trim();

    if (!content) {
        alert('Please enter an idea');
        return;
    }

    const targetAgent = target.value;

    try {
        const response = await fetch('/api/ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                targetAgent: targetAgent || null,
                timestamp: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('💡 Idea saved:', result.idea);

            // If target agent specified, send the prompt
            if (targetAgent) {
                if (targetAgent === 'moltbot') {
                    sendMoltbotMessage(content);
                } else {
                    sendPromptToAgent(targetAgent, content);
                }
            }

            // Clear input
            input.value = '';
            target.value = '';

            // Flash success
            input.style.borderColor = '#00ff41';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 500);
        }
    } catch (error) {
        console.error('Error saving idea:', error);
        alert('Failed to save idea');
    }
}

// Send prompt to specific agent
async function sendPromptToAgent(agentId, prompt) {
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'user',
                to: agentId,
                content: prompt,
                type: 'prompt'
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`📨 Sent to ${agentId}: ${prompt}`);
        }
    } catch (error) {
        console.error('Error sending prompt:', error);
    }
}

// ===== MOLTBOT - Real OpenClaw WebSocket Connection =====

// OpenClaw Gateway WebSocket Client (copied from openclaw-repo/ui/src/ui/gateway.ts)
class OpenClawGatewayClient {
    constructor(url, token) {
        this.url = url;
        this.token = token;
        this.ws = null;
        this.pending = new Map();
        this.connected = false;
        this.connectSent = false;
        this.connectNonce = null;
        this.sessionKey = 'default';
        this.chatMessages = [];
        this.chatStream = null;
        this.chatRunId = null;
        this.onConnected = null;
        this.onChatEvent = null;
    }

    start() {
        this.connect();
    }

    connect() {
        console.log('[MOLTBOT] Connecting to OpenClaw gateway:', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.addEventListener('open', () => {
            console.log('[MOLTBOT] WebSocket opened, queuing connect');
            this.queueConnect();
        });

        this.ws.addEventListener('message', (ev) => {
            this.handleMessage(String(ev.data ?? ''));
        });

        this.ws.addEventListener('close', (ev) => {
            console.log('[MOLTBOT] WebSocket closed:', ev.code, ev.reason);
            this.ws = null;
            this.connected = false;
            this.flushPending(new Error(`gateway closed (${ev.code}): ${ev.reason}`));
            // Auto-reconnect after 2 seconds
            setTimeout(() => this.connect(), 2000);
        });

        this.ws.addEventListener('error', () => {
            console.error('[MOLTBOT] WebSocket error');
        });
    }

    flushPending(err) {
        for (const [, p] of this.pending) {
            p.reject(err);
        }
        this.pending.clear();
    }

    queueConnect() {
        this.connectNonce = null;
        this.connectSent = false;
        setTimeout(() => {
            this.sendConnect();
        }, 750);
    }

    async sendConnect() {
        if (this.connectSent) return;
        this.connectSent = true;

        const params = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
                id: 'openclaw-control-ui',
                version: '1.0.0',
                platform: navigator.platform || 'web',
                mode: 'control'
            },
            role: 'operator',
            scopes: ['operator.read', 'operator.write', 'operator.admin'],
            auth: { token: this.token },
            userAgent: navigator.userAgent,
            locale: navigator.language
        };

        console.log('[MOLTBOT] Sending connect with params:', params);

        try {
            const hello = await this.request('connect', params);
            console.log('[MOLTBOT] Connected successfully! Hello:', hello);
            this.connected = true;
            if (this.onConnected) {
                this.onConnected();
            }
        } catch (err) {
            console.error('[MOLTBOT] Connect failed:', err);
            this.ws?.close(4008, 'connect failed');
        }
    }

    handleMessage(raw) {
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return;
        }

        const frame = parsed;

        if (frame.type === 'event') {
            // Handle connect.challenge
            if (frame.event === 'connect.challenge') {
                const nonce = frame.payload?.nonce;
                if (nonce) {
                    this.connectNonce = nonce;
                    this.sendConnect();
                }
                return;
            }

            // Handle chat events
            if (frame.event === 'chat' && this.onChatEvent) {
                this.onChatEvent(frame.payload);
            }
            return;
        }

        if (frame.type === 'res') {
            const pending = this.pending.get(frame.id);
            if (!pending) return;

            this.pending.delete(frame.id);
            if (frame.ok) {
                pending.resolve(frame.payload);
            } else {
                pending.reject(new Error(frame.error?.message ?? 'request failed'));
            }
        }
    }

    request(method, params) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('gateway not connected'));
        }

        const id = this.generateUUID();
        const frame = { type: 'req', id, method, params };

        const p = new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
        });

        console.log('[MOLTBOT] Sending request:', method, params);
        this.ws.send(JSON.stringify(frame));
        return p;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async loadChatHistory() {
        if (!this.connected) return;

        console.log('[MOLTBOT] Loading chat history');
        try {
            const res = await this.request('chat.history', {
                sessionKey: this.sessionKey,
                limit: 200
            });
            this.chatMessages = Array.isArray(res.messages) ? res.messages : [];
            console.log('[MOLTBOT] Loaded', this.chatMessages.length, 'messages');
            return this.chatMessages;
        } catch (err) {
            console.error('[MOLTBOT] Failed to load history:', err);
            return [];
        }
    }

    async sendChatMessage(message) {
        if (!this.connected) {
            throw new Error('Not connected to gateway');
        }

        const msg = message.trim();
        if (!msg) return null;

        const runId = this.generateUUID();
        this.chatRunId = runId;
        this.chatStream = '';

        // Add user message to local state
        const userMsg = {
            role: 'user',
            content: [{ type: 'text', text: msg }],
            timestamp: Date.now()
        };
        this.chatMessages.push(userMsg);

        console.log('[MOLTBOT] Sending chat message via HTTP API:', msg);

        try {
            // Use HTTP API instead of WebSocket
            const response = await fetch('/api/openclaw/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    sessionKey: this.sessionKey
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }

            const data = await response.json();
            console.log('[MOLTBOT] Response received:', data);

            // Add assistant response to local state
            if (data.response) {
                const assistantText = this.extractText(data.response);
                const assistantMsg = {
                    role: 'assistant',
                    content: [{ type: 'text', text: assistantText }],
                    timestamp: Date.now()
                };
                this.chatMessages.push(assistantMsg);
            }

            this.chatRunId = null;
            this.chatStream = null;

            return runId;
        } catch (err) {
            console.error('[MOLTBOT] Failed to send message:', err);
            this.chatRunId = null;
            this.chatStream = null;
            throw err;
        }
    }

    handleChatEvent(payload) {
        if (!payload || payload.sessionKey !== this.sessionKey) return;

        if (payload.state === 'delta') {
            // Streaming delta
            const text = this.extractText(payload.message);
            if (typeof text === 'string') {
                this.chatStream = text;
            }
        } else if (payload.state === 'final') {
            // Final message
            if (payload.message) {
                this.chatMessages.push(payload.message);
            }
            this.chatStream = null;
            this.chatRunId = null;
        } else if (payload.state === 'error') {
            console.error('[MOLTBOT] Chat error:', payload.errorMessage);
            this.chatStream = null;
            this.chatRunId = null;
        }
    }

    extractText(message) {
        if (!message) return '';
        if (typeof message === 'string') return message;
        // Handle response from HTTP API with { text: "...", raw: {...} } format
        if (message.text && typeof message.text === 'string') return message.text;
        if (message.content) {
            if (typeof message.content === 'string') return message.content;
            if (Array.isArray(message.content)) {
                return message.content
                    .map(c => c.type === 'text' ? c.text : '')
                    .join('');
            }
        }
        return '';
    }
}

// Initialize OpenClaw client
const OPENCLAW_GATEWAY_URL = 'ws://127.0.0.1:18791';
const OPENCLAW_TOKEN = 'local-dev-bypass'; // Local gateway auth token — not your Anthropic key. Use "Connect API Key" button to set your Anthropic key.
let openclawClient = null;
let moltbotInitialized = false;

async function initializeMoltbot() {
    console.log('[MOLTBOT] 🚀 initializeMoltbot() called');

    if (moltbotInitialized) {
        console.log('[MOLTBOT] ⏭️  Already initialized, skipping');
        return;
    }
    moltbotInitialized = true;

    console.log('[MOLTBOT] 🔧 Initializing OpenClaw via HTTP API');

    // CRITICAL: Clear any hardcoded HTML messages first
    const messagesContainer = document.getElementById('openclaw-messages');
    if (messagesContainer) {
        console.log('[MOLTBOT] 🧹 Clearing hardcoded HTML messages');
        messagesContainer.innerHTML = '';
    }

    try {
        console.log('[MOLTBOT] 📡 Fetching chat history from /api/openclaw/chat/history');
        const response = await fetch('/api/openclaw/chat/history');
        console.log('[MOLTBOT] 📡 Response status:', response.status);

        const data = await response.json();
        console.log('[MOLTBOT] 📦 Got data:', data);

        updateMoltbotStatus('Connected', true);
        console.log('[MOLTBOT] ✅ Status updated to Connected');

        const messages = data.messages || [];
        console.log('[MOLTBOT] 📨 Message count:', messages.length);

        // Show initial greeting from The Queen if no messages
        if (messages.length === 0) {
            console.log('[MOLTBOT] 👑 No messages, showing Queen greeting');
            showQueenGreeting();
        } else {
            console.log('[MOLTBOT] 📜 Displaying chat history');
            displayChatHistory(messages);
        }
    } catch (error) {
        console.error('[MOLTBOT] ❌ Failed to initialize:', error);
        updateMoltbotStatus('Disconnected', false);

        // Still show greeting even if history fails to load
        console.log('[MOLTBOT] 👑 Showing greeting despite error');
        showQueenGreeting();
    }
}

function updateMoltbotStatus(status, connected) {
    const statusEl = document.querySelector('.moltbot-header .status');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = 'status ' + (connected ? 'status-connected' : 'status-disconnected');
    }
}

function displayChatHistory(messages) {
    const container = document.getElementById('openclaw-messages');
    container.innerHTML = '';

    for (const msg of messages) {
        const isUser = msg.role === 'user';
        const text = msg.text || msg.content || '';
        addMoltbotMessageToUI(msg.role.toUpperCase(), text, isUser);
    }
}

function updateChatDisplay() {
    // No longer needed with HTTP API approach
    // Chat updates happen via request/response cycle
}

async function sendMoltbotMessage(messageContent) {
    console.log('[MOLTBOT] 🚀 sendMoltbotMessage() called');

    const input = document.getElementById('openclaw-input');
    const content = messageContent || input.value.trim();

    console.log('[MOLTBOT] 📝 Message content:', content);

    if (!content) {
        console.log('[MOLTBOT] ❌ Empty content, showing alert');
        alert('Please enter a message');
        return;
    }

    // ===== INSTANT HIVE START =====
    // Fire before anything else — does NOT block the Queen's response.
    // Trigger: the word "hive" anywhere in the message (case-insensitive).
    const lowerContent = content.toLowerCase();
    const isHiveCommand = lowerContent.includes('hive');

    if (isHiveCommand) {
        console.log('[HIVE] 🐝 Hive trigger detected — firing instantly');
        // Fire-and-forget: don't await, don't block the Queen
        fetch('/api/hive/start', { method: 'POST' })
            .then(r => r.json())
            .then(d => console.log(`[HIVE] ✅ Started ${d.count} terminals`))
            .catch(e => console.error('[HIVE] ❌ Failed to start hive:', e));
    }

    let loadingEl = null;

    try {
        console.log('[MOLTBOT] ➕ Adding user message to UI');
        // Add user message to UI immediately
        addMoltbotMessageToUI('USER', content, true);

        console.log('[MOLTBOT] ⏳ Adding loading indicator (three dots)');
        // Add loading indicator (three dots)
        loadingEl = addMoltbotLoadingIndicator();
        console.log('[MOLTBOT] ✅ Loading indicator added:', loadingEl);

        console.log('[MOLTBOT] 📡 Sending fetch request to /api/openclaw/chat/send');
        // Send via HTTP API
        const response = await fetch('/api/openclaw/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: content,
                sessionKey: 'test'
            })
        });

        console.log('[MOLTBOT] 📡 Response received, status:', response.status);

        // Remove loading indicator
        console.log('[MOLTBOT] ⏳ Removing loading indicator');
        if (loadingEl && loadingEl.parentNode) {
            loadingEl.remove();
            console.log('[MOLTBOT] ✅ Loading indicator removed');
        }

        if (!response.ok) {
            console.log('[MOLTBOT] ❌ Response not OK');
            const error = await response.json();
            throw new Error(error.error || 'Failed to send message');
        }

        console.log('[MOLTBOT] 📦 Parsing response JSON');
        const data = await response.json();
        console.log('[MOLTBOT] 📦 Parsed data:', data);

        // Display the response
        if (data.response && data.response.text) {
            console.log('[MOLTBOT] ✅ Adding Queen response to UI');
            addMoltbotMessageToUI('THE QUEEN', data.response.text, false);

            // Speak the response if TTS is enabled
            speakText(data.response.text);

            // Check if this is a "start hive" command
            if (data.startHive) {
                console.log('[MOLTBOT] 🐝 START HIVE DETECTED! Playing anthem...');
                playHiveAnthem();
            }
        } else {
            console.log('[MOLTBOT] ⚠️  No response text found in data');
        }

        // Clear input
        if (!messageContent) {
            console.log('[MOLTBOT] 🧹 Clearing input field');
            input.value = '';
        }

        console.log('[MOLTBOT] ✅ Message sent successfully');
    } catch (error) {
        console.error('[MOLTBOT] ❌ ERROR in sendMoltbotMessage:', error);
        console.error('[MOLTBOT] ❌ Error stack:', error.stack);
        console.error('[MOLTBOT] ❌ Full error details:', {
            message: error.message,
            name: error.name,
            status: error.status
        });

        // Remove loading indicator
        if (loadingEl && loadingEl.parentNode) {
            console.log('[MOLTBOT] 🧹 Removing loading indicator after error');
            loadingEl.remove();
        }

        console.log('[MOLTBOT] ❌ Adding detailed error message to UI');

        // Create detailed error message for user
        let errorMsg = `❌ Failed to send message\n\n`;
        errorMsg += `Error: ${error.message}\n`;
        errorMsg += `\nCheck the browser console (Cmd+Option+J) for more details.`;

        addMoltbotMessageToUI('🚨 THE QUEEN (ERROR)', errorMsg, false);
    }
}

function addMoltbotMessageToUI(from, content, isUser) {
    console.log(`[MOLTBOT] ➕ addMoltbotMessageToUI() - From: ${from}, Content: ${content.substring(0, 50)}...`);

    const messagesContainer = document.getElementById('openclaw-messages');
    if (!messagesContainer) {
        console.error('[MOLTBOT] ❌ ERROR: openclaw-messages container not found!');
        return null;
    }

    const messageEl = document.createElement('div');
    messageEl.className = isUser ? 'moltbot-message moltbot-message-user' : 'moltbot-message';

    const headerEl = document.createElement('div');
    headerEl.className = 'moltbot-message-header';
    headerEl.textContent = `${from} • ${new Date().toLocaleTimeString()}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'moltbot-message-content';

    // Parse markdown to HTML if marked library is available
    if (typeof marked !== 'undefined') {
        contentEl.innerHTML = marked.parse(content);
    } else {
        contentEl.textContent = content;
    }

    messageEl.appendChild(headerEl);
    messageEl.appendChild(contentEl);
    messagesContainer.appendChild(messageEl);

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageEl;
}

function addMoltbotLoadingIndicator() {
    const messagesContainer = document.getElementById('openclaw-messages');

    const messageEl = document.createElement('div');
    messageEl.className = 'moltbot-message moltbot-loading';

    const headerEl = document.createElement('div');
    headerEl.className = 'moltbot-message-header';
    headerEl.textContent = `THE QUEEN • ${new Date().toLocaleTimeString()}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'moltbot-message-content';
    contentEl.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';

    messageEl.appendChild(headerEl);
    messageEl.appendChild(contentEl);
    messagesContainer.appendChild(messageEl);

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageEl;
}

function showQueenGreeting() {
    console.log('[MOLTBOT] 👑 Showing Queen greeting...');

    // Always show The Queen's greeting immediately
    const messagesContainer = document.getElementById('openclaw-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        addMoltbotMessageToUI('THE QUEEN', '👑 Greetings! I am The Queen, the orchestrator of The Hive. I can see your screen, coordinate all six agents, and help you accomplish anything. What shall we build today?', false);
        updateMoltbotStatus('Ready', true);
        console.log('[MOLTBOT] ✅ Queen greeting displayed');
    }
}

// Alias for HTML button compatibility
function sendOpenClawMessage(messageContent) {
    return sendMoltbotMessage(messageContent);
}

// Initialize MOLTBOT on page load
// ===== KEYBOARD SHORTCUTS =====

document.addEventListener('keydown', (e) => {
    // Quick Ideas: Ctrl+I or Cmd+I
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        document.getElementById('quick-idea-input').focus();
    }

    // MOLTBOT: Ctrl+M or Cmd+M
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        const openclawInput = document.getElementById('openclaw-input');
        if (openclawInput) openclawInput.focus();
    }

    // Submit on Enter (plain Enter key) for OpenClaw chat input
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (document.activeElement.id === 'openclaw-input') {
            e.preventDefault();
            console.log('[KEYBOARD] Enter key pressed on openclaw-input, sending message...');
            sendMoltbotMessage();
        }
    }

    // Submit on Ctrl+Enter / Cmd+Enter (for backwards compatibility)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement.id === 'quick-idea-input') {
            saveQuickIdea();
        } else if (document.activeElement.id === 'openclaw-input') {
            sendMoltbotMessage();
        }
    }
});

// ===== TEXT-TO-SPEECH TOGGLE =====

let ttsEnabled = false;

function toggleTTS() {
    ttsEnabled = !ttsEnabled;
    const btn = document.getElementById('tts-toggle-btn');
    const icon = document.getElementById('tts-icon');

    if (ttsEnabled) {
        btn.classList.add('active');
        icon.textContent = '🎤';
        console.log('[TTS] Voice output ENABLED');
    } else {
        btn.classList.remove('active');
        icon.textContent = '🔇';
        console.log('[TTS] Voice output DISABLED');
    }
}

async function speakText(text) {
    if (!ttsEnabled) return;

    console.log('[TTS] Speaking:', text.substring(0, 50) + '...');

    try {
        const response = await fetch('/api/tts/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            console.error('[TTS] Failed to speak:', await response.text());
        }
    } catch (error) {
        console.error('[TTS] Error:', error);
    }
}

function playHiveAnthem() {
    console.log('[HIVE] 🎵 Playing Hive anthem...');
    console.log('[HIVE] 🎵 Audio file path: /trimmed.mp3');

    const audio = new Audio('/trimmed.mp3');
    audio.volume = 0.5; // 50% volume so it doesn't overpower TTS

    console.log('[HIVE] 🎵 Audio object created, attempting to play...');

    audio.play()
        .then(() => {
            console.log('[HIVE] ✅ Audio playing successfully!');
        })
        .catch(error => {
            console.error('[HIVE] ❌ Failed to play anthem:', error);
            console.error('[HIVE] ❌ Error details:', error.message, error.name);
        });
}

// Make it globally accessible for testing
window.testHiveMusic = playHiveAnthem;

// ===== FOLDER PICKER =====

function openFolderPicker(agentId) {
    console.log(`[FOLDER] Opening folder picker for ${agentId}`);
    const pickerElement = document.getElementById(`folder-picker-${agentId}`);
    if (pickerElement) {
        pickerElement.click();
    } else {
        console.error(`[FOLDER] Picker element not found for ${agentId}`);
    }
}

function handleFolderSelect(agentId, inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) {
        console.log(`[FOLDER] No folder selected for ${agentId}`);
        return;
    }

    // Get the first file to extract path information
    const firstFile = inputElement.files[0];
    const folderName = firstFile.webkitRelativePath.split('/')[0];

    // Try to get the full path
    let fullPath = '';
    if (firstFile.path) {
        // Electron/Node environment - has full path
        fullPath = firstFile.path.substring(0, firstFile.path.lastIndexOf('/'));
        console.log(`[FOLDER] Got full path from file.path: ${fullPath}`);
    } else {
        // Browser environment - need to prompt user for full path
        console.warn('[FOLDER] Browser detected - prompting user for full path');

        // Show prompt with the folder name pre-filled
        const userPath = prompt(
            `Please paste the FULL PATH to the "${folderName}" folder:\n\n` +
            `Example: /Users/yourname/Downloads/${folderName}\n\n` +
            `Tip: Right-click the folder in Finder and hold Option to "Copy as Pathname"`,
            `/Users/yourname/Downloads/${folderName}`
        );

        if (!userPath || userPath.trim() === '') {
            console.log('[FOLDER] User cancelled or provided empty path');
            inputElement.value = '';
            return;
        }

        fullPath = userPath.trim();
        console.log(`[FOLDER] User provided path: ${fullPath}`);
    }

    // Send change directory message to backend via WebSocket
    const ws = sockets.get(agentId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`[FOLDER] Sending change_directory message to ${agentId}: ${fullPath}`);
        ws.send(JSON.stringify({
            type: 'change_directory',
            path: fullPath
        }));

        // Update UI immediately (optimistic update)
        updateTerminalCwd(agentId, fullPath);
    } else {
        console.error(`[FOLDER] WebSocket not open for ${agentId}`);
        alert(`Cannot change directory - ${agentId} is not connected`);
    }

    // Clear the input so the same folder can be selected again
    inputElement.value = '';
}

function updateTerminalCwd(agentId, path) {
    const cwdElement = document.getElementById(`cwd-${agentId}`);
    if (cwdElement) {
        // Show shortened path (last 2 segments)
        const segments = path.split('/').filter(s => s);
        const shortPath = segments.length > 2
            ? '.../' + segments.slice(-2).join('/')
            : path;
        cwdElement.textContent = shortPath;
        cwdElement.title = path; // Full path on hover
        console.log(`[FOLDER] Updated CWD display for ${agentId}: ${shortPath}`);
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    console.log('🐝 THE HIVE is initializing...');

    // Initialize all 6 terminals
    initializeTerminals();
    console.log('✅ All 6 terminals initialized');

    // Initialize OpenClaw / The Queen
    console.log('👑 Initializing The Queen (OpenClaw)...');
    initializeMoltbot();
});

// ===== PERIODIC UPDATES =====

// Update terminal count every 5 seconds
setInterval(updateTerminalCount, 5000);

// Log active connections
setInterval(() => {
    const connections = Array.from(sockets.entries())
        .filter(([_, ws]) => ws.readyState === WebSocket.OPEN)
        .map(([id, _]) => id);

    console.log(`🔌 Active connections (${connections.length}/6):`, connections);
}, 30000);

// ============================================================
// Connect API Key Modal
// ============================================================

function openApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    modal.style.display = 'flex';
    document.getElementById('api-key-input').focus();
}

function closeApiKeyModal() {
    document.getElementById('api-key-modal').style.display = 'none';
    document.getElementById('api-key-status').textContent = '';
    document.getElementById('api-key-input').value = '';
}

async function submitApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    const statusEl = document.getElementById('api-key-status');

    if (!key.startsWith('sk-')) {
        statusEl.style.color = '#f66';
        statusEl.textContent = 'Invalid key format. Should start with sk-ant-...';
        return;
    }

    statusEl.style.color = '#888';
    statusEl.textContent = 'Saving...';

    try {
        const res = await fetch('/api/openclaw/setkey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
        });
        const data = await res.json();
        if (data.success) {
            statusEl.style.color = '#6f6';
            statusEl.textContent = 'API key connected! The Queen is ready.';
            const btn = document.getElementById('connect-api-key-btn');
            btn.textContent = 'Connected ✓';
            btn.style.color = '#6f6';
            btn.style.borderColor = '#4a4';
            setTimeout(closeApiKeyModal, 1800);
        } else {
            statusEl.style.color = '#f66';
            statusEl.textContent = data.error || 'Failed to save key.';
        }
    } catch (e) {
        statusEl.style.color = '#f66';
        statusEl.textContent = 'Server error. Is the Hive server running?';
    }
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('api-key-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeApiKeyModal();
        });
    }
    // Allow Enter key to submit
    const input = document.getElementById('api-key-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitApiKey();
            if (e.key === 'Escape') closeApiKeyModal();
        });
    }
});

