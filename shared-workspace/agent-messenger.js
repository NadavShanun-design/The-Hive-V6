#!/usr/bin/env node

/**
 * Agent Messenger - File-based message broker for multi-agent communication
 * Based on A2A protocol and TeammateTool patterns
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname);
const MESSAGES_DIR = path.join(WORKSPACE, 'messages');
const AGENTS = ['master', 'coder', 'researcher', 'tester', 'file_manager'];

class AgentMessenger {
  constructor(agentName) {
    this.agentName = agentName;
    this.inbox = path.join(MESSAGES_DIR, agentName);
  }

  /**
   * Send a message to a specific agent
   */
  sendTo(recipient, message) {
    const timestamp = new Date().toISOString();
    const messageObj = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      from: this.agentName,
      to: recipient,
      content: message,
      timestamp: timestamp,
      type: 'direct'
    };

    const recipientInbox = path.join(MESSAGES_DIR, recipient);
    const messagePath = path.join(recipientInbox, `${messageObj.id}.json`);

    fs.writeFileSync(messagePath, JSON.stringify(messageObj, null, 2));
    console.log(`✓ Message sent to ${recipient}`);
    return messageObj.id;
  }

  /**
   * Broadcast message to all agents
   */
  broadcast(message) {
    const timestamp = new Date().toISOString();
    const messageObj = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      from: this.agentName,
      to: 'all',
      content: message,
      timestamp: timestamp,
      type: 'broadcast'
    };

    AGENTS.forEach(agent => {
      if (agent !== this.agentName) {
        const agentInbox = path.join(MESSAGES_DIR, agent);
        const messagePath = path.join(agentInbox, `${messageObj.id}.json`);
        fs.writeFileSync(messagePath, JSON.stringify(messageObj, null, 2));
      }
    });

    console.log(`✓ Broadcast sent to all agents`);
    return messageObj.id;
  }

  /**
   * Read all unread messages from inbox
   */
  readInbox() {
    const messages = [];
    const files = fs.readdirSync(this.inbox);

    files.forEach(file => {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.inbox, file), 'utf8');
        messages.push(JSON.parse(content));
      }
    });

    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Clear inbox (mark all as read)
   */
  clearInbox() {
    const files = fs.readdirSync(this.inbox);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(this.inbox, file));
      }
    });
    console.log(`✓ Inbox cleared`);
  }

  /**
   * Request task from another agent
   */
  requestTask(recipient, task) {
    const message = {
      type: 'task_request',
      task: task,
      requestId: Date.now()
    };
    return this.sendTo(recipient, message);
  }

  /**
   * Send task completion
   */
  completeTask(recipient, taskId, result) {
    const message = {
      type: 'task_complete',
      taskId: taskId,
      result: result
    };
    return this.sendTo(recipient, message);
  }

  /**
   * Get list of all agents
   */
  static listAgents() {
    return AGENTS;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Agent Messenger CLI

Usage:
  node agent-messenger.js send <from> <to> <message>
  node agent-messenger.js broadcast <from> <message>
  node agent-messenger.js read <agent>
  node agent-messenger.js clear <agent>
  node agent-messenger.js list

Examples:
  node agent-messenger.js send master coder "Implement the login function"
  node agent-messenger.js broadcast master "Everyone, review the PR"
  node agent-messenger.js read coder
  node agent-messenger.js list
`);
    process.exit(0);
  }

  if (command === 'send') {
    const [_, from, to, ...messageParts] = args;
    const message = messageParts.join(' ');
    const messenger = new AgentMessenger(from);
    messenger.sendTo(to, message);
  } else if (command === 'broadcast') {
    const [_, from, ...messageParts] = args;
    const message = messageParts.join(' ');
    const messenger = new AgentMessenger(from);
    messenger.broadcast(message);
  } else if (command === 'read') {
    const [_, agent] = args;
    const messenger = new AgentMessenger(agent);
    const messages = messenger.readInbox();
    console.log(JSON.stringify(messages, null, 2));
  } else if (command === 'clear') {
    const [_, agent] = args;
    const messenger = new AgentMessenger(agent);
    messenger.clearInbox();
  } else if (command === 'list') {
    console.log('Available agents:', AgentMessenger.listAgents());
  }
}

module.exports = AgentMessenger;
