const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const MemoryManager = require('./memory-manager');
const OpenClawChatClient = require('./openclaw-chat-client');

const execAsync = promisify(exec);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Serve hive.html as the default UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hive.html'));
});

// Use zsh on macOS (default since Catalina) to avoid bash deprecation warnings
// Bash deprecation warning interferes with Claude Code CLI terminal sessions
const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh';

// Store active terminal sessions and memory managers
const terminals = new Map();
const memoryManagers = new Map();

// OpenClaw WebSocket Gateway Integration
const OPENCLAW_GATEWAY_URL = 'ws://127.0.0.1:18791';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'local-dev-bypass'; // Override via OPENCLAW_GATEWAY_TOKEN env var
let openclawClient = null;
let openclawConnected = false;

// Initialize OpenClaw Gateway Client
function initializeOpenClawClient() {
    console.log('🦞 Initializing OpenClaw Gateway Client...');

    openclawClient = new OpenClawChatClient(OPENCLAW_GATEWAY_URL, OPENCLAW_TOKEN);

    openclawClient.on('connected', (payload) => {
        console.log('✅ OpenClaw Gateway connected!');
        console.log('🎯 Gateway capabilities:', payload.caps);
        openclawConnected = true;
    });

    openclawClient.on('disconnected', () => {
        console.log('❌ OpenClaw Gateway disconnected');
        openclawConnected = false;
    });

    openclawClient.on('chat.event', (event) => {
        console.log('💬 Chat event received:', event);
    });

    openclawClient.connect();
}

// Helper function to send message via OpenClaw Gateway
async function openclawSend(message, sessionId = 'default') {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[OpenClaw] 🚀 SENDING MESSAGE`);
    console.log(`[OpenClaw] Session ID: ${sessionId}`);
    console.log(`[OpenClaw] Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    console.log(`[OpenClaw] Timestamp: ${new Date().toISOString()}`);

    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const escapedMessage = message.replace(/'/g, "'\\''");

        // CRITICAL: Force OpenClaw to run from THIS folder only (Rule 4: Folder Isolation)
        const openclawStateDir = path.join(process.cwd(), '.openclaw-state');
        const openclawConfigPath = path.join(process.cwd(), '.openclaw-state', 'openclaw.json');

        // Ensure .openclaw-state directory exists
        if (!fs.existsSync(openclawStateDir)) {
            fs.mkdirSync(openclawStateDir, { recursive: true });
            console.log(`[OpenClaw] 📁 Created local OpenClaw state directory: ${openclawStateDir}`);
        }

        const cmd = `./node_modules/.bin/openclaw agent --local --message '${escapedMessage}' --session-id '${sessionId}' 2>&1`;

        console.log(`[OpenClaw] 📋 Command: ${cmd.substring(0, 150)}...`);
        console.log(`[OpenClaw] 📁 State Dir: ${openclawStateDir}`);
        console.log(`[OpenClaw] 📋 Config Path: ${openclawConfigPath}`);
        console.log(`[OpenClaw] ⏳ Executing...`);

        // Read API key from local config
        const configPath = path.join(process.cwd(), '.openclaw-state', 'openclaw.json');
        let apiKey = null;
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            apiKey = config.env?.ANTHROPIC_API_KEY;
        }

        const { stdout, stderr } = await execAsync(cmd, {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 120000,
            cwd: process.cwd(), // Run from project root
            env: {
                ...process.env,
                OPENCLAW_STATE_DIR: openclawStateDir,
                OPENCLAW_CONFIG_PATH: openclawConfigPath,
                ANTHROPIC_API_KEY: apiKey || process.env.ANTHROPIC_API_KEY // CRITICAL: Pass API key as env var
            }
        });

        const duration = Date.now() - startTime;
        const output = (stdout + stderr).trim();

        console.log(`[OpenClaw] ✅ Command completed in ${duration}ms`);
        console.log(`[OpenClaw] 📦 Raw output length: ${output.length} chars`);
        console.log(`[OpenClaw] 📄 Raw output (first 500 chars):\n${output.substring(0, 500)}`);

        // Check for authentication errors
        if (output.includes('401') || output.includes('authentication_error') || output.includes('invalid x-api-key')) {
            console.error(`[OpenClaw] 🔐 AUTHENTICATION ERROR DETECTED`);
            console.error(`[OpenClaw] Full error output:\n${output}`);
            return JSON.stringify({
                payloads: [{
                    text: `🔐 AUTHENTICATION ERROR\n\nThe API key is invalid or missing.\n\nFull error:\n${output}`,
                    mediaUrl: null
                }]
            });
        }

        // Check for gateway errors - but only if there's NO actual response
        const hasGatewayError = output.includes('Gateway agent failed') || output.includes('gateway closed');
        if (hasGatewayError) {
            console.warn(`[OpenClaw] ⚠️  Gateway error detected (but checking for response anyway...)`);
        }

        // Extract clean response by removing tool warnings and error lines
        const lines = output.split('\n');
        console.log(`[OpenClaw] 📊 Total lines: ${lines.length}`);

        // Find where the actual response starts (after all the error/config lines)
        let responseStartIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.length > 0 &&
                !line.startsWith('gateway connect failed') &&
                !line.startsWith('Gateway agent failed') &&
                !line.startsWith('Gateway target:') &&
                !line.startsWith('Source:') &&
                !line.startsWith('Config:') &&
                !line.startsWith('Bind:') &&
                !line.startsWith('HTTP 401') &&
                !line.startsWith('[tools]') &&
                !line.startsWith('[browser')) {
                responseStartIndex = i;
                break;
            }
        }

        console.log(`[OpenClaw] 📍 Response start index: ${responseStartIndex}`);

        let responseText = '';
        if (responseStartIndex >= 0) {
            // Get the last non-empty, non-error line as the response
            responseText = lines[responseStartIndex].trim();
        }

        console.log(`[OpenClaw] 📝 Final response text: "${responseText}"`);
        console.log(`${'='.repeat(80)}\n`);

        return JSON.stringify({
            payloads: [{ text: responseText || '❌ No response text found', mediaUrl: null }]
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[OpenClaw] ❌ EXCEPTION after ${duration}ms`);
        console.error(`[OpenClaw] Error name: ${error.name}`);
        console.error(`[OpenClaw] Error message: ${error.message}`);
        console.error(`[OpenClaw] Error stack:\n${error.stack}`);
        console.log(`${'='.repeat(80)}\n`);
        return JSON.stringify({
            payloads: [{ text: `⚠️ OpenClaw Exception: ${error.message}`, mediaUrl: null }]
        });
    }
}

// Initialize OpenClaw Gateway Client on startup
initializeOpenClawClient();
console.log('✅ OpenClaw WebSocket Gateway client initialized');

// ===== THE HIVE CONFIGURATION =====
// 3 Project Batches, each with Master + Coder = 6 terminals total
const PROJECT_BATCHES = [
    {
        id: 'project1',
        name: 'Project 1',
        workspace: path.join(process.cwd(), 'projects', 'project-1'),
        agents: [
            {
                id: 'project1-master',
                role: 'master',
                systemPrompt: 'You are the MASTER agent for Project 1. You plan, architect, review, and direct the CODER agent. You can send instructions to the Coder via the shared message bus.'
            },
            {
                id: 'project1-coder',
                role: 'coder',
                systemPrompt: 'You are the CODER agent for Project 1. You implement code based on instructions from the MASTER agent. Focus on writing, testing, and debugging code.'
            }
        ]
    },
    {
        id: 'project2',
        name: 'Project 2',
        workspace: path.join(process.cwd(), 'projects', 'project-2'),
        agents: [
            {
                id: 'project2-master',
                role: 'master',
                systemPrompt: 'You are the MASTER agent for Project 2. You plan, architect, review, and direct the CODER agent. You can send instructions to the Coder via the shared message bus.'
            },
            {
                id: 'project2-coder',
                role: 'coder',
                systemPrompt: 'You are the CODER agent for Project 2. You implement code based on instructions from the MASTER agent. Focus on writing, testing, and debugging code.'
            }
        ]
    },
    {
        id: 'project3',
        name: 'Project 3',
        workspace: path.join(process.cwd(), 'projects', 'project-3'),
        agents: [
            {
                id: 'project3-master',
                role: 'master',
                systemPrompt: 'You are the MASTER agent for Project 3. You plan, architect, review, and direct the CODER agent. You can send instructions to the Coder via the shared message bus.'
            },
            {
                id: 'project3-coder',
                role: 'coder',
                systemPrompt: 'You are the CODER agent for Project 3. You implement code based on instructions from the MASTER agent. Focus on writing, testing, and debugging code.'
            }
        ]
    }
];

// Initialize directories and memory managers for all agents
PROJECT_BATCHES.forEach(project => {
    // Create project workspace
    if (!fs.existsSync(project.workspace)) {
        fs.mkdirSync(project.workspace, { recursive: true });
    }

    // Create CLAUDE.md for the project
    const claudeMdPath = path.join(project.workspace, 'CLAUDE.md');
    if (!fs.existsSync(claudeMdPath)) {
        const claudeMd = `# ${project.name}

## Project Description
[Add your project description here]

## Agent Roles

### Master Agent (${project.agents[0].id})
${project.agents[0].systemPrompt}

### Coder Agent (${project.agents[1].id})
${project.agents[1].systemPrompt}

## Current Task/Objective
[Add current task here]

## Shared Conventions
- Both agents share this workspace directory
- Master reviews code and provides architecture guidance
- Coder implements and tests code
- Use the message bus for inter-agent communication

## Files in this project
[This section will be updated automatically]
`;
        fs.writeFileSync(claudeMdPath, claudeMd);
    }

    // Initialize memory managers for each agent
    project.agents.forEach(agent => {
        memoryManagers.set(agent.id, new MemoryManager(agent.id));
    });
});

// ===== EXTRA TERMINALS (30 pre-configured, always trusted) =====

const EXTRA_TERMINALS = Array.from({ length: 30 }, (_, i) => ({
    id: `extra-${i + 1}`,
    termNumber: 7 + i,
    role: 'agent',
    workspace: path.join(process.cwd(), 'projects', `extra-${i + 1}`),
    systemPrompt: `You are Agent T${7 + i} in The Hive (terminal extra-${i + 1}). You are a general-purpose AI coding agent ready to help with any task.`
}));

// Trusted settings — same permissions as the main Claude install
const CLAUDE_TRUSTED_SETTINGS = {
    effortLevel: 'high',
    permissionMode: 'allow_all',
    permissions: {
        allow: [
            'Bash(*)', 'Edit(*)', 'Write(*)', 'Read(*)',
            'Glob(*)', 'Grep(*)', 'Task(*)', 'WebFetch(*)',
            'WebSearch(*)', 'NotebookEdit(*)'
        ]
    }
};

// Pre-create workspaces and trusted Claude configs for all 30 extra terminals
EXTRA_TERMINALS.forEach(terminal => {
    // Create workspace directory
    if (!fs.existsSync(terminal.workspace)) {
        fs.mkdirSync(terminal.workspace, { recursive: true });
    }

    // Write a CLAUDE.md so Claude knows its identity
    const claudeMdPath = path.join(terminal.workspace, 'CLAUDE.md');
    if (!fs.existsSync(claudeMdPath)) {
        fs.writeFileSync(claudeMdPath,
            `# T${terminal.termNumber} — The Hive Agent\n\n` +
            `Terminal ID: ${terminal.id}\n\n` +
            `You are a general-purpose AI coding agent in The Hive.\n` +
            `Work on whatever task the operator sends you.\n`
        );
    }

    // Create Claude config directory
    const configDir = path.join(os.homedir(), `.claude-${terminal.id}`);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Write settings.json with full trust so Claude never asks for permission
    const settingsPath = path.join(configDir, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify(CLAUDE_TRUSTED_SETTINGS, null, 2));
    }

    // Create projects sub-dir so Claude doesn't treat it as a brand-new install
    const projectsDir = path.join(configDir, 'projects');
    if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
    }

    // Pre-create the encoded workspace path dir that Claude creates on first run
    // Claude encodes /foo/bar -> -foo-bar
    const encoded = terminal.workspace.replace(/\//g, '-');
    const projectConfigDir = path.join(projectsDir, encoded);
    if (!fs.existsSync(projectConfigDir)) {
        fs.mkdirSync(projectConfigDir, { recursive: true });
    }
});

console.log(`🔧 ${EXTRA_TERMINALS.length} extra terminals pre-configured with trusted Claude settings (T7–T${6 + EXTRA_TERMINALS.length})`);

// ===== MEMORY API ENDPOINTS (unchanged from original) =====

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

app.get('/api/memory/:agent/export', (req, res) => {
    const agentName = req.params.agent;
    const memory = memoryManagers.get(agentName);

    if (!memory) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(memory.exportMemory());
});

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

app.get('/api/memory', (req, res) => {
    const overview = {};

    memoryManagers.forEach((memory, agentName) => {
        overview[agentName] = {
            context: memory.getContext(),
            recentPrompts: memory.getLastPrompts(3)
        };
    });

    res.json(overview);
});

// ===== QUICK IDEAS API =====

app.post('/api/ideas', (req, res) => {
    try {
        const { content, tags, projectId, targetAgent } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const ideasDir = path.join(process.cwd(), 'ideas');
        if (!fs.existsSync(ideasDir)) {
            fs.mkdirSync(ideasDir, { recursive: true });
        }

        const idea = {
            id: Date.now().toString(),
            content,
            tags: tags || [],
            projectId: projectId || null,
            targetAgent: targetAgent || null,
            timestamp: new Date().toISOString(),
            status: 'pending' // pending, sent, completed
        };

        const filepath = path.join(ideasDir, `idea-${idea.id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(idea, null, 2));

        console.log(`💡 Saved idea: ${content.substring(0, 50)}...`);

        res.json({
            success: true,
            idea
        });
    } catch (error) {
        console.error('Error saving idea:', error);
        res.status(500).json({ error: 'Failed to save idea' });
    }
});

app.get('/api/ideas', (req, res) => {
    try {
        const ideasDir = path.join(process.cwd(), 'ideas');

        if (!fs.existsSync(ideasDir)) {
            return res.json({ ideas: [] });
        }

        const ideas = fs.readdirSync(ideasDir)
            .filter(f => f.startsWith('idea-') && f.endsWith('.json'))
            .map(f => {
                const filepath = path.join(ideasDir, f);
                const content = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(content);
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ ideas });
    } catch (error) {
        console.error('Error reading ideas:', error);
        res.status(500).json({ error: 'Failed to read ideas' });
    }
});

app.patch('/api/ideas/:id', (req, res) => {
    try {
        const ideaId = req.params.id;
        const updates = req.body;

        const ideasDir = path.join(process.cwd(), 'ideas');
        const filepath = path.join(ideasDir, `idea-${ideaId}.json`);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Idea not found' });
        }

        const idea = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const updatedIdea = { ...idea, ...updates };

        fs.writeFileSync(filepath, JSON.stringify(updatedIdea, null, 2));

        res.json({
            success: true,
            idea: updatedIdea
        });
    } catch (error) {
        console.error('Error updating idea:', error);
        res.status(500).json({ error: 'Failed to update idea' });
    }
});

app.delete('/api/ideas/:id', (req, res) => {
    try {
        const ideaId = req.params.id;
        const ideasDir = path.join(process.cwd(), 'ideas');
        const filepath = path.join(ideasDir, `idea-${ideaId}.json`);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Idea not found' });
        }

        fs.unlinkSync(filepath);

        res.json({
            success: true,
            message: 'Idea deleted'
        });
    } catch (error) {
        console.error('Error deleting idea:', error);
        res.status(500).json({ error: 'Failed to delete idea' });
    }
});

// ===== GOALS API =====

app.post('/api/goals', (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const goalsDir = path.join(process.cwd(), 'goals');
        if (!fs.existsSync(goalsDir)) {
            fs.mkdirSync(goalsDir, { recursive: true });
        }

        // Read and increment counter
        const counterPath = path.join(goalsDir, 'counter.json');
        let counter = { nextNumber: 1 };
        if (fs.existsSync(counterPath)) {
            counter = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
        }

        const goalNumber = counter.nextNumber;
        counter.nextNumber = goalNumber + 1;
        fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2));

        const now = new Date().toISOString();
        const goal = {
            id: Date.now().toString(),
            number: goalNumber,
            title,
            description: description || '',
            status: 'pending',
            createdAt: now,
            updatedAt: now
        };

        const filepath = path.join(goalsDir, `goal-${goal.id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(goal, null, 2));

        console.log(`🎯 Created goal #${goalNumber}: ${title}`);

        res.json({ success: true, goal });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

app.get('/api/goals', (req, res) => {
    try {
        const goalsDir = path.join(process.cwd(), 'goals');

        if (!fs.existsSync(goalsDir)) {
            return res.json({ goals: [] });
        }

        const goals = fs.readdirSync(goalsDir)
            .filter(f => f.startsWith('goal-') && f.endsWith('.json'))
            .map(f => {
                const filepath = path.join(goalsDir, f);
                const content = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(content);
            })
            .sort((a, b) => a.number - b.number);

        res.json({ goals });
    } catch (error) {
        console.error('Error reading goals:', error);
        res.status(500).json({ error: 'Failed to read goals' });
    }
});

app.get('/api/goals/:id', (req, res) => {
    try {
        const goalId = req.params.id;
        const goalsDir = path.join(process.cwd(), 'goals');
        const filepath = path.join(goalsDir, `goal-${goalId}.json`);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goal = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        res.json({ goal });
    } catch (error) {
        console.error('Error reading goal:', error);
        res.status(500).json({ error: 'Failed to read goal' });
    }
});

app.patch('/api/goals/:id', (req, res) => {
    try {
        const goalId = req.params.id;
        const updates = req.body;
        const goalsDir = path.join(process.cwd(), 'goals');
        const filepath = path.join(goalsDir, `goal-${goalId}.json`);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goal = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        if (updates.title !== undefined) goal.title = updates.title;
        if (updates.description !== undefined) goal.description = updates.description;
        if (updates.status !== undefined) goal.status = updates.status;
        goal.updatedAt = new Date().toISOString();

        fs.writeFileSync(filepath, JSON.stringify(goal, null, 2));

        console.log(`🎯 Updated goal #${goal.number}: ${goal.title}`);

        res.json({ success: true, goal });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

app.delete('/api/goals/:id', (req, res) => {
    try {
        const goalId = req.params.id;
        const goalsDir = path.join(process.cwd(), 'goals');
        const filepath = path.join(goalsDir, `goal-${goalId}.json`);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        fs.unlinkSync(filepath);

        console.log(`🎯 Deleted goal: ${goalId}`);

        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// ===== INTER-AGENT MESSAGE BUS API =====

app.post('/api/messages', (req, res) => {
    try {
        const { from, to, content, type, metadata } = req.body;

        if (!from || !to || !content) {
            return res.status(400).json({ error: 'from, to, and content are required' });
        }

        const messagesDir = path.join(process.cwd(), 'agent-messages');
        if (!fs.existsSync(messagesDir)) {
            fs.mkdirSync(messagesDir, { recursive: true });
        }

        const message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from,
            to,
            content,
            type: type || 'direct', // direct, broadcast, prompt, response
            metadata: metadata || {},
            timestamp: new Date().toISOString()
        };

        const filepath = path.join(messagesDir, `${message.id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(message, null, 2));

        console.log(`📨 Message: ${from} → ${to}: ${content.substring(0, 50)}...`);

        // If this is a prompt to a terminal agent, inject it
        if (type === 'prompt' && terminals.has(to)) {
            const terminal = terminals.get(to);
            const prefixedPrompt = `[FROM ${from.toUpperCase()}]: ${content}`;
            terminal.ptyProcess.write(`echo "${prefixedPrompt}"\r`);
            terminal.ptyProcess.write(`${content}\r`);
        }

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/api/messages', (req, res) => {
    try {
        const { from, to, limit } = req.query;
        const messagesDir = path.join(process.cwd(), 'agent-messages');

        if (!fs.existsSync(messagesDir)) {
            return res.json({ messages: [] });
        }

        let messages = fs.readdirSync(messagesDir)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const filepath = path.join(messagesDir, f);
                const content = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(content);
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Filter by from/to if provided
        if (from) {
            messages = messages.filter(m => m.from === from);
        }
        if (to) {
            messages = messages.filter(m => m.to === to || m.to === 'broadcast');
        }

        // Limit results
        if (limit) {
            messages = messages.slice(0, parseInt(limit));
        }

        res.json({ messages });
    } catch (error) {
        console.error('Error reading messages:', error);
        res.status(500).json({ error: 'Failed to read messages' });
    }
});

// ===== EXTRA TERMINALS API =====

app.get('/api/extra-terminals', (req, res) => {
    res.json(EXTRA_TERMINALS.map(t => ({
        id: t.id,
        termNumber: t.termNumber,
        workspace: t.workspace
    })));
});

// ===== PROJECT BATCHES API =====

app.get('/api/projects', (req, res) => {
    res.json({
        projects: PROJECT_BATCHES.map(p => ({
            id: p.id,
            name: p.name,
            workspace: p.workspace,
            agents: p.agents.map(a => ({
                id: a.id,
                role: a.role
            }))
        }))
    });
});

app.get('/api/projects/:projectId/files', (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = PROJECT_BATCHES.find(p => p.id === projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const workspace = project.workspace;

        if (!fs.existsSync(workspace)) {
            return res.json({ files: [] });
        }

        // Recursively read directory structure
        function readDir(dir, baseDir = dir) {
            let files = [];
            const items = fs.readdirSync(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                const relativePath = path.relative(baseDir, fullPath);

                if (item.isDirectory()) {
                    files.push({
                        name: item.name,
                        path: relativePath,
                        type: 'directory'
                    });
                    files = files.concat(readDir(fullPath, baseDir));
                } else {
                    const stats = fs.statSync(fullPath);
                    files.push({
                        name: item.name,
                        path: relativePath,
                        type: 'file',
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }

            return files;
        }

        const files = readDir(workspace);

        res.json({ files });
    } catch (error) {
        console.error('Error reading project files:', error);
        res.status(500).json({ error: 'Failed to read project files' });
    }
});

// ===== TERMINAL OUTPUT CAPTURE API =====

app.get('/api/terminals/:agentId/output', (req, res) => {
    const agentId = req.params.agentId;
    const lines = parseInt(req.query.lines) || 200;

    const terminal = terminals.get(agentId);

    if (!terminal) {
        return res.status(404).json({ error: 'Terminal not found' });
    }

    // Return last N lines of output buffer
    const outputLines = terminal.outputBuffer.split('\n').slice(-lines);

    res.json({
        agentId,
        output: outputLines.join('\n'),
        lines: outputLines.length
    });
});

// ===== OPENCLAW CHAT API =====

// Send a chat message
app.post('/api/openclaw/chat/send', async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`\n[API ${requestId}] 📨 Received chat send request`);

    try {
        const { message, sessionKey } = req.body;
        console.log(`[API ${requestId}] Message: "${message?.substring(0, 100) || 'undefined'}"`);
        console.log(`[API ${requestId}] Session: ${sessionKey || 'default'}`);

        if (!message || !message.trim()) {
            console.log(`[API ${requestId}] ❌ Empty message rejected`);
            return res.status(400).json({ error: 'Message is required' });
        }

        // Detect hive keyword — the client already fired /api/hive/start instantly.
        // To avoid the Queen using tools to send 'claude' a second time (wasting credits),
        // short-circuit here and return a canned confirmation. No AI call needed.
        const shouldStartHive = message.toLowerCase().includes('hive');

        if (shouldStartHive) {
            console.log(`[API ${requestId}] 🐝 Hive message — returning canned response, skipping OpenClaw call`);
            return res.json({
                success: true,
                response: { text: 'The Hive is live. All terminals started and running.' },
                startHive: true
            });
        }

        console.log(`[API ${requestId}] ✅ Validation passed, calling openclawSend...`);

        const rawResponse = await openclawSend(message, sessionKey || 'default');

        console.log(`[API ${requestId}] ✅ Got raw response from OpenClaw`);

        // Parse JSON response from CLI
        console.log(`[API ${requestId}] 🔍 Parsing JSON response...`);
        let parsedResponse;
        let responseText = '';

        try {
            // Find the JSON object in the response (skip stderr lines)
            const lines = rawResponse.split('\n').filter(line => !line.includes('Gateway agent failed'));
            let jsonStart = -1;

            console.log(`[API ${requestId}] 📄 Response has ${lines.length} lines`);

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (trimmed.startsWith('{')) {
                    jsonStart = i;
                    break;
                }
            }

            if (jsonStart >= 0) {
                console.log(`[API ${requestId}] ✅ Found JSON at line ${jsonStart}`);
                const jsonStr = lines.slice(jsonStart).join('\n').trim();
                parsedResponse = JSON.parse(jsonStr);

                if (parsedResponse.payloads && Array.isArray(parsedResponse.payloads)) {
                    responseText = parsedResponse.payloads
                        .map(p => p.text || '')
                        .filter(t => t)
                        .join('\n')
                        .trim();
                    console.log(`[API ${requestId}] ✅ Extracted text: ${responseText.substring(0, 100)}...`);
                }
            } else {
                console.log(`[API ${requestId}] ❌ No JSON found in response`);
                responseText = 'No valid response found';
            }
        } catch (e) {
            console.error(`[API ${requestId}] ❌ Error parsing response:`, e.message);
            console.error(`[API ${requestId}] Raw response (first 500 chars):`, rawResponse.substring(0, 500));
            responseText = 'Error parsing response';
        }

        console.log(`[API ${requestId}] 📤 Sending response to client...`);
        res.json({
            success: true,
            response: {
                text: responseText,
                raw: parsedResponse
            },
            startHive: shouldStartHive
        });
        console.log(`[API ${requestId}] ✅ Response sent successfully\n`);
    } catch (error) {
        console.error(`[API ${requestId}] ❌ FATAL ERROR:`, error.message);
        console.error(`[API ${requestId}] Stack:`, error.stack);
        res.status(500).json({ error: error.message });
    }
});

// Get chat history (CLI doesn't support history, return empty)
app.get('/api/openclaw/chat/history', async (req, res) => {
    res.json({ messages: [] });
});

// Abort current chat
app.post('/api/openclaw/chat/abort', async (req, res) => {
    try {
        const { sessionKey, runId } = req.body;

        if (!openclawConnected || !openclawClient) {
            return res.status(503).json({ error: 'OpenClaw not connected' });
        }

        await openclawClient.abortChat(sessionKey || 'default', runId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error aborting chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== FAST HIVE START =====
// Dedicated lean endpoint — no AI, no waiting.
// Sends `claude\n` to every connected terminal immediately.
// Called client-side the instant the user's message is submitted.

let lastHiveFiredAt = 0; // 5-second guard against double-fires

app.post('/api/hive/start', (req, res) => {
    const now = Date.now();
    if (now - lastHiveFiredAt < 5000) {
        console.log('[HIVE] ⏳ Cooldown active, skipping');
        return res.json({ fired: false, reason: 'cooldown' });
    }
    lastHiveFiredAt = now;

    const allIds = Array.from(terminals.keys());
    const fired = [];
    const skipped = [];

    for (const agentId of allIds) {
        const terminal = terminals.get(agentId);
        if (terminal && terminal.ptyProcess) {
            terminal.ptyProcess.write('claude\n');
            terminal.claudeCodeStarted = true;
            fired.push(agentId);
        } else {
            skipped.push(agentId);
        }
    }

    // Play anthem
    exec('afplay public/trimmed.mp3 &');

    console.log(`[HIVE] 🐝 Fired! claude sent to ${fired.length} terminals: ${fired.join(', ')}`);
    if (skipped.length) console.log(`[HIVE] ⏭️  Skipped (no PTY): ${skipped.join(', ')}`);

    res.json({ fired: true, count: fired.length, terminals: fired });
});

// Text-to-Speech endpoint
app.post('/api/tts/speak', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log(`👑🎤 [TTS] Speaking: ${text.substring(0, 50)}...`);

        // Use Samantha - standard US English female voice
        const voice = 'Samantha (English (US))';

        // Execute the say command
        // Note: We don't await this because we want the response to be immediate
        exec(`say -v "${voice}" "${text.replace(/"/g, '\\"')}"`, (error) => {
            if (error) {
                console.error('[TTS] Error executing say command:', error);
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('[TTS] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get OpenClaw chat connection status
app.get('/api/openclaw/status', (req, res) => {
    res.json({
        connected: openclawConnected,
        method: 'websocket-gateway',
        gatewayUrl: OPENCLAW_GATEWAY_URL
    });
});

// Save user's Anthropic API key locally for OpenClaw to use
app.post('/api/openclaw/setkey', (req, res) => {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string') {
        return res.json({ success: false, error: 'No API key provided' });
    }
    if (!apiKey.startsWith('sk-')) {
        return res.json({ success: false, error: 'Invalid API key format. Should start with sk-...' });
    }
    try {
        const stateDir = path.join(process.cwd(), '.openclaw-state');
        if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
        const configPath = path.join(stateDir, 'openclaw.json');
        let config = {};
        if (fs.existsSync(configPath)) {
            try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
        }
        if (!config.env) config.env = {};
        config.env.ANTHROPIC_API_KEY = apiKey;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
        console.log('✅ Anthropic API key saved via Connect API Key button');
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Failed to save key: ' + e.message });
    }
});

// Test endpoint for screen capture
app.get('/api/openclaw/screenshot', async (req, res) => {
    try {
        if (!openclawClient || !openclawConnected) {
            return res.status(503).json({ error: 'OpenClaw Gateway not connected' });
        }

        const screenshot = await openclawClient.captureScreen();
        res.json({ success: true, screenshot });
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== WEBSOCKET TERMINAL HANDLER =====

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const agentId = url.searchParams.get('agent');
    const type = url.searchParams.get('type');

    // Handle OpenClaw chat WebSocket connections
    if (type === 'openclaw-chat') {
        console.log('💬 New OpenClaw chat connection');

        // Send current connection status
        ws.send(JSON.stringify({
            type: openclawConnected ? 'openclaw-connected' : 'openclaw-disconnected'
        }));

        ws.on('close', () => {
            // No-op, we're not tracking clients anymore
        });

        return;
    }

    if (!agentId) {
        console.error('⚠️ WebSocket connection without agent ID');
        ws.close();
        return;
    }

    console.log(`🔌 New terminal connection: ${agentId}`);

    // Find which project this agent belongs to
    let agentConfig = null;
    let projectWorkspace = null;

    for (const project of PROJECT_BATCHES) {
        const agent = project.agents.find(a => a.id === agentId);
        if (agent) {
            agentConfig = agent;
            projectWorkspace = project.workspace;
            break;
        }
    }

    // Check pre-configured extra terminals (extra-1 through extra-30)
    if (!agentConfig) {
        const extra = EXTRA_TERMINALS.find(t => t.id === agentId);
        if (extra) {
            agentConfig = { id: extra.id, role: extra.role, systemPrompt: extra.systemPrompt };
            projectWorkspace = extra.workspace;
            console.log(`🔧 Extra terminal: ${agentId} (T${extra.termNumber}), workspace: ${projectWorkspace}`);
        }
    }

    // Fallback: allow truly dynamic terminal IDs (dynamic-1, dynamic-2, etc.)
    if (!agentConfig && agentId.startsWith('dynamic-')) {
        agentConfig = {
            id: agentId,
            role: 'agent',
            systemPrompt: 'You are an AI agent in The Hive.'
        };
        projectWorkspace = os.homedir();
        console.log(`🆕 Dynamic terminal: ${agentId}, workspace: ${projectWorkspace}`);
    }

    if (!agentConfig) {
        console.error(`⚠️ Unknown agent ID: ${agentId}`);
        ws.close();
        return;
    }

    // Set up the config directory for this agent
    const configDir = path.join(os.homedir(), `.claude-${agentId}`);

    // Create environment with separate Claude config + project workspace
    const env = Object.assign({}, process.env);

    // Remove Claude Code environment variables to allow nested sessions
    delete env.CLAUDECODE;
    delete env.CLAUDE_SESSION_ID;

    env.CLAUDE_CONFIG_DIR = configDir;
    env.CLAUDE_CODE_SHELL = '/bin/zsh'; // Explicitly set shell for Claude Code CLI
    env.BASH_SILENCE_DEPRECATION_WARNING = '1'; // Suppress bash deprecation warning
    env.AGENT_ID = agentId;
    env.AGENT_ROLE = agentConfig.role;
    env.PROJECT_WORKSPACE = projectWorkspace;
    env.SYSTEM_PROMPT = agentConfig.systemPrompt;

    // Spawn a real shell in the project workspace
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: projectWorkspace,
        env: env
    });

    // Store the terminal session
    const memory = memoryManagers.get(agentId);
    terminals.set(agentId, {
        ptyProcess,
        ws,
        memory,
        inputBuffer: '',
        outputBuffer: '',
        currentWorkingDirectory: projectWorkspace,
        claudeCodeStarted: false  // Track if Claude Code has been started
    });

    console.log(`✅ Started ${agentConfig.role} terminal for ${agentId}`);
    console.log(`   Workspace: ${projectWorkspace}`);
    console.log(`   Config: ${configDir}`);

    // Send data from terminal to WebSocket client
    ptyProcess.onData((data) => {
        try {
            // Capture output for context sharing
            const terminal = terminals.get(agentId);
            if (terminal) {
                terminal.outputBuffer += data;
                // Keep only last 50KB of output
                if (terminal.outputBuffer.length > 50000) {
                    terminal.outputBuffer = terminal.outputBuffer.slice(-50000);
                }
            }

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
                ptyProcess.write(msg.data);

                // Track input in buffer
                const terminal = terminals.get(agentId);
                if (terminal) {
                    terminal.inputBuffer += msg.data;

                    // If user pressed Enter, save the command to memory
                    if (msg.data.includes('\r') || msg.data.includes('\n')) {
                        const command = terminal.inputBuffer.trim();
                        if (command && command.length > 0) {
                            const metadata = {
                                cwd: projectWorkspace,
                                timestamp: new Date().toISOString(),
                                type: 'command',
                                agentRole: agentConfig.role
                            };
                            if (memory) memory.savePrompt(command, '', metadata);
                            console.log(`📝 [${agentId}] ${command.substring(0, 50)}...`);
                        }
                        terminal.inputBuffer = '';
                    }
                }
            } else if (msg.type === 'resize') {
                ptyProcess.resize(msg.cols, msg.rows);
            } else if (msg.type === 'change_directory') {
                // Handle directory change request
                const folderPath = msg.path;
                console.log(`📁 [${agentId}] Change directory request: ${folderPath}`);

                // Send cd command to the terminal
                const cdCommand = `cd "${folderPath}"\n`;
                ptyProcess.write(cdCommand);

                // Update the terminal's working directory tracking
                const terminal = terminals.get(agentId);
                if (terminal) {
                    terminal.currentWorkingDirectory = folderPath;
                    console.log(`📁 [${agentId}] Updated CWD to: ${folderPath}`);
                }

                // Send confirmation back to client
                try {
                    ws.send(JSON.stringify({
                        type: 'directory_changed',
                        path: folderPath,
                        success: true
                    }));
                } catch (sendError) {
                    console.error(`❌ [${agentId}] Failed to send confirmation:`, sendError);
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Handle WebSocket close
    ws.on('close', () => {
        console.log(`🔌 Terminal disconnected: ${agentId}`);
        ptyProcess.kill();
        terminals.delete(agentId);
    });

    // Handle terminal exit
    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`Terminal exited for ${agentId}: exitCode=${exitCode}, signal=${signal}`);
        try {
            ws.close();
        } catch (error) {
            // WebSocket already closed
        }
        terminals.delete(agentId);
    });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🐝 THE HIVE IS ONLINE 🐝                   ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Dashboard:    http://localhost:${PORT}
🔌 WebSocket:    ws://localhost:${PORT}

📦 Project Batches:
${PROJECT_BATCHES.map((p, i) => `   ${i + 1}. ${p.name}
      - ${p.agents[0].id} (Master)
      - ${p.agents[1].id} (Coder)
      Workspace: ${p.workspace}`).join('\n\n')}

💡 Quick Ideas:  /api/ideas

🎯 Each project batch has 2 terminals (Master + Coder)
📁 Both agents in a batch share the same workspace
💬 Inter-agent communication via message bus
🧠 All agents have persistent memory

🚀 Ready to coordinate! Open the dashboard to start.
`);
});

// Raw terminal input API (added by OpenClaw)
app.post('/api/terminals/:agentId/input', (req, res) => {
    const agentId = req.params.agentId;
    const { data } = req.body;
    
    const terminal = terminals.get(agentId);
    if (!terminal) {
        return res.status(404).json({ error: 'Terminal not found' });
    }
    
    terminal.ptyProcess.write(data);
    res.json({ success: true, agentId, sent: data.length + ' chars' });
});
