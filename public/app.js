const agents = ['master', 'coder', 'researcher', 'tester', 'file_manager'];

// Store terminal instances and WebSocket connections
const terminals = {};
const sockets = {};

// Initialize each agent terminal
agents.forEach(agentName => {
    // Create xterm.js terminal
    const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
            background: '#000000',
            foreground: '#ffffff',
            cursor: '#00d9ff',
            selection: 'rgba(0, 217, 255, 0.3)',
            black: '#000000',
            red: '#ff5555',
            green: '#50fa7b',
            yellow: '#f1fa8c',
            blue: '#bd93f9',
            magenta: '#ff79c6',
            cyan: '#8be9fd',
            white: '#bbbbbb',
            brightBlack: '#555555',
            brightRed: '#ff5555',
            brightGreen: '#50fa7b',
            brightYellow: '#f1fa8c',
            brightBlue: '#bd93f9',
            brightMagenta: '#ff79c6',
            brightCyan: '#8be9fd',
            brightWhite: '#ffffff'
        },
        cols: 100,
        rows: 20
    });

    // Fit addon for responsive terminal sizing
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal in the DOM
    term.open(document.getElementById(`terminal-${agentName}`));
    fitAddon.fit();

    // Store terminal instance
    terminals[agentName] = term;

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}?agent=${agentName}`;
    const socket = new WebSocket(wsUrl);

    sockets[agentName] = socket;

    const statusDot = document.getElementById(`status-${agentName}`);

    // WebSocket connection opened
    socket.onopen = () => {
        console.log(`Connected to ${agentName} agent`);
        statusDot.classList.remove('disconnected');
        term.write(`\r\n\x1b[1;32m✓ Connected to ${agentName} agent terminal\x1b[0m\r\n`);
        term.write(`\x1b[1;36mCLAUDE_CONFIG_DIR=~/.claude-agent-${agentName}\x1b[0m\r\n`);
        term.write(`\x1b[1;33mType 'claude' to start Claude Code CLI\x1b[0m\r\n\r\n`);
    };

    // WebSocket received data
    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'output') {
                term.write(msg.data);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };

    // WebSocket connection closed
    socket.onclose = () => {
        console.log(`Disconnected from ${agentName} agent`);
        statusDot.classList.add('disconnected');
        term.write('\r\n\x1b[1;31m✗ Connection closed\x1b[0m\r\n');
    };

    // WebSocket error
    socket.onerror = (error) => {
        console.error(`WebSocket error for ${agentName}:`, error);
        statusDot.classList.add('disconnected');
    };

    // Send user input to the terminal
    term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'input',
                data: data
            }));
        }
    });

    // Handle terminal resize
    term.onResize(({ cols, rows }) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'resize',
                cols: cols,
                rows: rows
            }));
        }
    });

    // Fit terminal on window resize
    window.addEventListener('resize', () => {
        fitAddon.fit();
    });
});

// Display welcome message in master terminal
setTimeout(() => {
    const masterTerm = terminals['master'];
    if (masterTerm) {
        masterTerm.write('\r\n\x1b[1;35m╔════════════════════════════════════════════════════════╗\x1b[0m\r\n');
        masterTerm.write('\x1b[1;35m║\x1b[0m  \x1b[1;36m🚀 Welcome to Vibe Coder Multi-Agent System\x1b[0m        \x1b[1;35m║\x1b[0m\r\n');
        masterTerm.write('\x1b[1;35m╚════════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n');
    }
}, 1000);

// Handle Quick Ideas form submission
const quickIdeasForm = document.getElementById('quick-ideas-form');
const quickIdeasInput = document.getElementById('quick-ideas-input');

quickIdeasForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = quickIdeasInput.value.trim();
    if (!prompt) return;

    try {
        const response = await fetch('/api/save-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Prompt saved successfully:', data);

            // Clear input
            quickIdeasInput.value = '';

            // Visual feedback - flash the input border
            quickIdeasInput.style.borderColor = '#4caf50';
            setTimeout(() => {
                quickIdeasInput.style.borderColor = '';
            }, 1000);
        } else {
            console.error('Failed to save prompt');
            alert('Failed to save prompt. Check console for details.');
        }
    } catch (error) {
        console.error('Error saving prompt:', error);
        alert('Error saving prompt: ' + error.message);
    }
});
