const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Manager for Claude Code CLI instances
class ClaudeAgentManager {
  constructor() {
    this.agents = new Map();
    this.messageQueue = [];
    this.setupWorkspaces();
  }

  setupWorkspaces() {
    // Create workspace directories for each agent
    const baseDir = path.join(__dirname, '../agent-workspaces');

    const agentDirs = {
      master: path.join(baseDir, 'master'),
      coder: path.join(baseDir, 'coder'),
      researcher: path.join(baseDir, 'researcher'),
      tester: path.join(baseDir, 'tester'),
      file_manager: path.join(baseDir, 'file_manager')
    };

    // Create directories if they don't exist
    Object.values(agentDirs).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    this.workspaces = agentDirs;
  }

  // Get CLI command for launching Claude Code
  getClaudeCommand() {
    // Return the claude command - user will authenticate themselves
    return 'claude';
  }

  // Create a launcher script for each agent
  createLauncherScript(agentName) {
    const workspace = this.workspaces[agentName];
    const scriptPath = path.join(workspace, 'launch.sh');
    const messagePipe = path.join(workspace, 'messages.fifo');
    const outputPipe = path.join(workspace, 'output.fifo');

    // Create named pipes for communication
    if (!fs.existsSync(messagePipe)) {
      try {
        require('child_process').execSync(`mkfifo ${messagePipe}`);
      } catch (e) {
        // Pipe might already exist
      }
    }

    if (!fs.existsSync(outputPipe)) {
      try {
        require('child_process').execSync(`mkfifo ${outputPipe}`);
      } catch (e) {
        // Pipe might already exist
      }
    }

    const script = `#!/bin/bash
# Launcher for ${agentName.toUpperCase()} Agent
# This will start Claude Code CLI for this agent

echo "🤖 Starting ${agentName.toUpperCase()} Agent..."
echo "📁 Workspace: ${workspace}"
echo ""
echo "⚠️  IMPORTANT: You need to authenticate with Claude Code CLI"
echo "   Run 'claude auth' if you haven't already"
echo ""
echo "This agent will:"
echo "  - Listen for messages from other agents"
echo "  - Communicate with the master agent"
echo "  - Have access to files in: ${workspace}"
echo ""
echo "Press Enter to start Claude Code CLI..."
read

cd "${workspace}"

# Start Claude Code in this directory
${this.getClaudeCommand()}
`;

    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '0755');

    return scriptPath;
  }

  // Create communication bridge scripts
  createCommunicationBridge(agentName) {
    const workspace = this.workspaces[agentName];
    const bridgeScript = path.join(workspace, 'message-bridge.js');

    const bridge = `// Message Bridge for ${agentName}
// This script connects Claude Code CLI to the central server

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const AGENT_NAME = '${agentName}';
const WORKSPACE = '${workspace}';
const SERVER_URL = 'ws://localhost:3002';

console.log(\`🌉 Message Bridge for \${AGENT_NAME.toUpperCase()} Agent\`);
console.log(\`📡 Connecting to server at \${SERVER_URL}\`);

// Connect to main server
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
  console.log(\`✅ Connected to server\`);

  // Register this agent
  ws.send(JSON.stringify({
    type: 'agent_register',
    agentName: AGENT_NAME,
    workspace: WORKSPACE,
    timestamp: Date.now()
  }));

  console.log(\`\`);
  console.log(\`📝 Agent ready. Waiting for messages...\`);
  console.log(\`\`);
  console.log(\`💡 TIP: Messages from other agents will appear here.\`);
  console.log(\`   You can copy them and paste into your Claude Code CLI terminal.\`);
  console.log(\`\`);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);

    // Ignore messages not for this agent
    if (message.to && message.to !== AGENT_NAME && message.to !== 'all') {
      return;
    }

    if (message.type === 'agent_message') {
      console.log(\`\`);
      console.log(\`${'='.repeat(60)}\`);
      console.log(\`📨 NEW MESSAGE FROM: \${message.from.toUpperCase()}\`);
      console.log(\`${'='.repeat(60)}\`);
      console.log(\`\`);
      console.log(message.content);
      console.log(\`\`);
      console.log(\`${'='.repeat(60)}\`);
      console.log(\`\`);

      // Save to file for reference
      const messagesFile = path.join(WORKSPACE, 'received-messages.log');
      const logEntry = \`
[\${new Date().toISOString()}] FROM: \${message.from}
\${message.content}
${'='.repeat(60)}

\`;
      fs.appendFileSync(messagesFile, logEntry);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

ws.on('close', () => {
  console.log('❌ Disconnected from server');
  console.log('Attempting to reconnect in 5 seconds...');
  setTimeout(() => {
    console.log('🔄 Reconnecting...');
    // In production, implement reconnection logic
  }, 5000);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

// Interactive CLI for sending messages
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(\`\`);
console.log(\`Type a message to send to other agents (or 'help' for commands):\`);
console.log(\`\`);

rl.on('line', (input) => {
  const trimmed = input.trim();

  if (!trimmed) return;

  if (trimmed === 'help') {
    console.log(\`
Available commands:
  help              - Show this help
  status            - Show agent status
  send <agent> <msg> - Send message to specific agent
  broadcast <msg>    - Send message to all agents

Format for sending:
  send master Hello from \${AGENT_NAME}
  broadcast Need help with this task
    \`);
    return;
  }

  if (trimmed === 'status') {
    console.log(\`
Agent: \${AGENT_NAME}
Workspace: \${WORKSPACE}
Connected: \${ws.readyState === 1 ? 'Yes' : 'No'}
    \`);
    return;
  }

  // Parse send command
  if (trimmed.startsWith('send ')) {
    const parts = trimmed.substring(5).split(' ');
    const recipient = parts[0];
    const message = parts.slice(1).join(' ');

    if (!message) {
      console.log('❌ No message content provided');
      return;
    }

    ws.send(JSON.stringify({
      type: 'agent_message',
      from: AGENT_NAME,
      to: recipient,
      content: message,
      timestamp: Date.now()
    }));

    console.log(\`✅ Message sent to \${recipient}\`);
    return;
  }

  // Parse broadcast command
  if (trimmed.startsWith('broadcast ')) {
    const message = trimmed.substring(10);

    ws.send(JSON.stringify({
      type: 'agent_message',
      from: AGENT_NAME,
      to: 'all',
      content: message,
      timestamp: Date.now()
    }));

    console.log(\`✅ Message broadcast to all agents\`);
    return;
  }

  // Default: send to master
  ws.send(JSON.stringify({
    type: 'agent_message',
    from: AGENT_NAME,
    to: 'master',
    content: trimmed,
    timestamp: Date.now()
  }));

  console.log(\`✅ Message sent to master\`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(\`\\n👋 Shutting down \${AGENT_NAME} bridge...\`);
  ws.close();
  rl.close();
  process.exit(0);
});
`;

    fs.writeFileSync(bridgeScript, bridge);
    return bridgeScript;
  }

  // Initialize all agent workspaces
  initializeAllAgents() {
    const agents = ['master', 'coder', 'researcher', 'tester', 'file_manager'];

    agents.forEach(agentName => {
      // Create launcher
      const launcher = this.createLauncherScript(agentName);

      // Create communication bridge
      const bridge = this.createCommunicationBridge(agentName);

      // Create README
      const readme = path.join(this.workspaces[agentName], 'README.md');
      const readmeContent = `# ${agentName.toUpperCase()} Agent

## Role
${this.getAgentRole(agentName)}

## How to Start

### 1. Start the Message Bridge (Terminal 1)
\`\`\`bash
cd ${this.workspaces[agentName]}
node message-bridge.js
\`\`\`

### 2. Start Claude Code CLI (Terminal 2)
\`\`\`bash
cd ${this.workspaces[agentName]}
./launch.sh
\`\`\`

Or manually:
\`\`\`bash
cd ${this.workspaces[agentName]}
claude
\`\`\`

## Communication

### Receiving Messages
Messages from other agents will appear in the message-bridge terminal.
Copy them and give them to Claude in your CLI terminal.

### Sending Messages
In the message-bridge terminal, type:

- \`send master <message>\` - Send to master agent
- \`send coder <message>\` - Send to coder agent
- \`broadcast <message>\` - Send to all agents
- Or just type a message to send to master

### Working Directory
This agent has access to files in:
\`${this.workspaces[agentName]}\`

Claude can read/write files in this directory.

## Tips

1. Keep both terminals visible
2. Copy messages from bridge to Claude
3. When Claude gives you output for other agents, use bridge to send it
4. All agents can access their own workspace files
5. Master agent coordinates everything

## Files
- \`launch.sh\` - Starts Claude Code CLI
- \`message-bridge.js\` - Handles communication
- \`received-messages.log\` - Log of all received messages
`;

      fs.writeFileSync(readme, readmeContent);

      this.agents.set(agentName, {
        name: agentName,
        workspace: this.workspaces[agentName],
        launcher: launcher,
        bridge: bridge,
        status: 'ready'
      });
    });

    return this.agents;
  }

  getAgentRole(agentName) {
    const roles = {
      master: 'Coordinates all other agents. Receives tasks from UI and delegates to specialist agents.',
      coder: 'Handles code generation, refactoring, and code analysis tasks.',
      researcher: 'Performs research, gathers information, and provides insights.',
      tester: 'Runs tests, validates code, and ensures quality.',
      file_manager: 'Manages file operations, reads/writes files on the system.'
    };
    return roles[agentName] || 'General purpose agent';
  }

  // Get status of all agents
  getStatus() {
    const status = {};
    this.agents.forEach((agent, name) => {
      status[name] = {
        name: agent.name,
        workspace: agent.workspace,
        status: agent.status,
        launcher: agent.launcher,
        bridge: agent.bridge
      };
    });
    return status;
  }
}

module.exports = { ClaudeAgentManager };
