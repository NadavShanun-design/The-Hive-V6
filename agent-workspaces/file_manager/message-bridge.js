// Message Bridge for file_manager
// This script connects Claude Code CLI to the central server

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const AGENT_NAME = 'file_manager';
const WORKSPACE = path.join(__dirname);
const SERVER_URL = 'ws://localhost:3002';

console.log(`🌉 Message Bridge for ${AGENT_NAME.toUpperCase()} Agent`);
console.log(`📡 Connecting to server at ${SERVER_URL}`);

// Connect to main server
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
  console.log(`✅ Connected to server`);

  // Register this agent
  ws.send(JSON.stringify({
    type: 'agent_register',
    agentName: AGENT_NAME,
    workspace: WORKSPACE,
    timestamp: Date.now()
  }));

  console.log(``);
  console.log(`📝 Agent ready. Waiting for messages...`);
  console.log(``);
  console.log(`💡 TIP: Messages from other agents will appear here.`);
  console.log(`   You can copy them and paste into your Claude Code CLI terminal.`);
  console.log(``);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);

    // Ignore messages not for this agent
    if (message.to && message.to !== AGENT_NAME && message.to !== 'all') {
      return;
    }

    if (message.type === 'agent_message') {
      console.log(``);
      console.log(`============================================================`);
      console.log(`📨 NEW MESSAGE FROM: ${message.from.toUpperCase()}`);
      console.log(`============================================================`);
      console.log(``);
      console.log(message.content);
      console.log(``);
      console.log(`============================================================`);
      console.log(``);

      // Save to file for reference
      const messagesFile = path.join(WORKSPACE, 'received-messages.log');
      const logEntry = `
[${new Date().toISOString()}] FROM: ${message.from}
${message.content}
============================================================

`;
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

console.log(``);
console.log(`Type a message to send to other agents (or 'help' for commands):`);
console.log(``);

rl.on('line', (input) => {
  const trimmed = input.trim();

  if (!trimmed) return;

  if (trimmed === 'help') {
    console.log(`
Available commands:
  help              - Show this help
  status            - Show agent status
  send <agent> <msg> - Send message to specific agent
  broadcast <msg>    - Send message to all agents

Format for sending:
  send master Hello from ${AGENT_NAME}
  broadcast Need help with this task
    `);
    return;
  }

  if (trimmed === 'status') {
    console.log(`
Agent: ${AGENT_NAME}
Workspace: ${WORKSPACE}
Connected: ${ws.readyState === 1 ? 'Yes' : 'No'}
    `);
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

    console.log(`✅ Message sent to ${recipient}`);
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

    console.log(`✅ Message broadcast to all agents`);
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

  console.log(`✅ Message sent to master`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n👋 Shutting down ${AGENT_NAME} bridge...`);
  ws.close();
  rl.close();
  process.exit(0);
});
