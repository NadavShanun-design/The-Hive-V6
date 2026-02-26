const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');
const MemoryManager = require('./memory-manager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Add JSON body parser for API endpoints
app.use(express.json());

// Determine the shell to use - use full path for macOS/Linux
const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';

// Store active terminal sessions and memory managers
const terminals = new Map();
const memoryManagers = new Map();

// Initialize memory managers for all agents
const agentNames = ['master', 'coder', 'researcher', 'tester', 'file_manager'];
agentNames.forEach(agentName => {
    memoryManagers.set(agentName, new MemoryManager(agentName));
});

// ===== MEMORY API ENDPOINTS =====

// Get agent's memory summary
app.get('/api/memory/:agent', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
        agent: agentName,
        context: memory.getContext(),
        summary: memory.getMemorySummary(),
        recentPrompts: memory.getLastPrompts(10)
    });
});

// Get agent's full prompt history
app.get('/api/memory/:agent/history', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    res.json({
        agent: agentName,
        history: memory.getPromptHistory(limit)
    });
});

// Save a prompt to agent's memory
app.post('/api/memory/:agent/prompt', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    const { prompt, response, metadata } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const success = memory.savePrompt(prompt, response || '', metadata || {});
    memory.updateMemorySummary();

    res.json({
        success,
        message: success ? 'Prompt saved successfully' : 'Failed to save prompt'
    });
});

// Search agent's prompts
app.get('/api/memory/:agent/search', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);
    const keyword = req.query.q;

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    if (!keyword) {
        return res.status(400).json({ error: 'Search query (q) is required' });
    }

    res.json({
        agent: agentName,
        keyword,
        results: memory.searchPrompts(keyword)
    });
});

// Export all memory for an agent
app.get('/api/memory/:agent/export', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(memory.exportMemory());
});

// Clear agent's memory
app.delete('/api/memory/:agent', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    const success = memory.clearMemory();
    res.json({
        success,
        message: success ? 'Memory cleared successfully' : 'Failed to clear memory'
    });
});

// Get all agents' memory overview
app.get('/api/memory', (req, res) => {
    const overview = {};

    agentNames.forEach(agentName => {
        const memory = memoryManagers.get(agentName);
        overview[agentName] = {
            context: memory.getContext(),
            recentPrompts: memory.getLastPrompts(3)
        };
    });

    res.json(overview);
});

// Save quick prompt to last-prompt folder
app.post('/api/save-prompt', (req, res) => {
    try {
        const { prompt, timestamp } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Create last-prompt directory if it doesn't exist
        const lastPromptDir = path.join(process.cwd(), 'last-prompt');
        if (!fs.existsSync(lastPromptDir)) {
            fs.mkdirSync(lastPromptDir, { recursive: true });
        }

        // Create a filename with timestamp
        const filename = `prompt_${Date.now()}.json`;
        const filepath = path.join(lastPromptDir, filename);

        // Save the prompt
        const data = {
            prompt,
            timestamp: timestamp || new Date().toISOString(),
            id: Date.now()
        };

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        // Also save as "latest.json" for easy access
        const latestPath = path.join(lastPromptDir, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));

        console.log(`📝 Saved quick prompt to: ${filepath}`);

        res.json({
            success: true,
            message: 'Prompt saved successfully',
            filepath,
            data
        });
    } catch (error) {
        console.error('Error saving prompt:', error);
        res.status(500).json({ error: 'Failed to save prompt' });
    }
});

// Get all saved prompts
app.get('/api/saved-prompts', (req, res) => {
    try {
        const lastPromptDir = path.join(process.cwd(), 'last-prompt');

        if (!fs.existsSync(lastPromptDir)) {
            return res.json({ prompts: [] });
        }

        const files = fs.readdirSync(lastPromptDir)
            .filter(f => f.endsWith('.json') && f !== 'latest.json')
            .map(f => {
                const filepath = path.join(lastPromptDir, f);
                const content = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(content);
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ prompts: files });
    } catch (error) {
        console.error('Error reading prompts:', error);
        res.status(500).json({ error: 'Failed to read prompts' });
    }
});

// Watch for command files and auto-execute them
function watchForCommands(agentName, inboxDir, ptyProcess) {
    // Check for command files every 2 seconds
    const watcher = setInterval(() => {
        try {
            const files = fs.readdirSync(inboxDir);
            const commandFiles = files.filter(f => f.startsWith('__command_'));

            for (const file of commandFiles) {
                const filePath = path.join(inboxDir, file);
                const commandData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                if (commandData.type === 'auto_prompt') {
                    console.log(`\n🤖 Auto-prompting ${agentName}: ${commandData.command}`);

                    // Inject command into terminal (simulate typing + Enter)
                    ptyProcess.write(`${commandData.command}\r`);

                    // Delete the command file so it doesn't execute again
                    fs.unlinkSync(filePath);

                    console.log(`✓ Command injected into ${agentName} terminal`);
                }
            }
        } catch (error) {
            // Ignore errors (directory might not exist yet)
        }
    }, 2000);

    // Clean up watcher when terminal closes
    ptyProcess.onExit(() => {
        clearInterval(watcher);
    });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const agentName = url.searchParams.get('agent') || 'default';

    console.log(`New terminal connection for agent: ${agentName}`);

    // Set up the config directory for this agent
    const configDir = path.join(os.homedir(), `.claude-agent-${agentName}`);
    const sharedWorkspace = path.join(process.cwd(), 'shared-workspace');

    // Create environment with separate Claude config + shared workspace access
    const env = Object.assign({}, process.env);
    env.CLAUDE_CONFIG_DIR = configDir;
    env.AGENT_NAME = agentName;
    env.SHARED_WORKSPACE = sharedWorkspace;
    env.AGENT_INBOX = path.join(sharedWorkspace, 'messages', agentName);
    env.AGENT_PROJECTS = path.join(sharedWorkspace, 'projects');
    env.AGENT_TASKS = path.join(sharedWorkspace, 'tasks');
    env.AGENT_OUTPUTS = path.join(sharedWorkspace, 'outputs');

    // Spawn a real shell with the custom config directory
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: env
    });

    // Store the terminal session
    const memory = memoryManagers.get(agentName);
    terminals.set(agentName, { ptyProcess, ws, memory, inputBuffer: '', outputBuffer: '' });

    console.log(`Started shell for ${agentName}`);
    console.log(`  CLAUDE_CONFIG_DIR=${configDir}`);
    console.log(`  SHARED_WORKSPACE=${sharedWorkspace}`);
    console.log(`  AGENT_NAME=${agentName}`);
    console.log(`  MEMORY: Loaded with ${memory.getPromptHistory().length} previous prompts`);

    // Watch for auto-prompt command files
    const inboxDir = path.join(sharedWorkspace, 'messages', agentName);
    watchForCommands(agentName, inboxDir, ptyProcess);

    // Send data from terminal to WebSocket client
    ptyProcess.onData((data) => {
        try {
            ws.send(JSON.stringify({ type: 'output', data }));
        } catch (error) {
            console.error('Error sending data to client:', error);
        }
    });

    // Handle incoming messages from WebSocket client
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            if (msg.type === 'input') {
                // Write user input to the terminal
                ptyProcess.write(msg.data);

                // Track input in buffer
                const terminalSession = terminals.get(agentName);
                if (terminalSession) {
                    terminalSession.inputBuffer += msg.data;

                    // If user pressed Enter, save the command to memory
                    if (msg.data.includes('\r') || msg.data.includes('\n')) {
                        const command = terminalSession.inputBuffer.trim();
                        if (command && command.length > 0) {
                            // Save to memory
                            const metadata = {
                                cwd: process.cwd(),
                                timestamp: new Date().toISOString(),
                                type: 'command'
                            };
                            memory.savePrompt(command, '', metadata);
                            console.log(`📝 Saved command to ${agentName} memory: ${command.substring(0, 50)}...`);
                        }
                        // Clear input buffer
                        terminalSession.inputBuffer = '';
                    }
                }
            } else if (msg.type === 'resize') {
                // Resize the terminal
                ptyProcess.resize(msg.cols, msg.rows);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Handle WebSocket close
    ws.on('close', () => {
        console.log(`Terminal disconnected for agent: ${agentName}`);
        ptyProcess.kill();
        terminals.delete(agentName);
    });

    // Handle terminal exit
    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`Terminal exited for ${agentName}: exitCode=${exitCode}, signal=${signal}`);
        try {
            ws.close();
        } catch (error) {
            // WebSocket already closed
        }
        terminals.delete(agentName);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`\n🚀 Vibe Coder Server Running!`);
    console.log(`\n📡 Server listening on http://localhost:${PORT}`);
    console.log(`\n🎯 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`\n💡 You'll see 5 terminals - type "claude" in each one to start Claude Code CLI`);
    console.log(`\n🔐 Each agent has its own config directory (.claude-agent-{name})`);
    console.log(`\n✨ Authenticate each one separately using the Claude Code CLI auth flow`);
    console.log(`\n`);
});
