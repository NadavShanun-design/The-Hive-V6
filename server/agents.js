const { v4: uuidv4 } = require('uuid');

// Event bus for inter-agent communication
class MessageBus {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(agentId, callback) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId).push(callback);
  }

  publish(message) {
    console.log(`[MessageBus] Publishing message:`, message);
    // Broadcast to all subscribers
    for (const [agentId, callbacks] of this.subscribers.entries()) {
      callbacks.forEach(callback => callback(message));
    }
  }

  unsubscribe(agentId) {
    this.subscribers.delete(agentId);
  }
}

// Base Agent class
class Agent {
  constructor(name, type, messageBus) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.messageBus = messageBus;
    this.status = 'idle';
    this.memory = [];

    // Subscribe to message bus
    this.messageBus.subscribe(this.id, this.receiveMessage.bind(this));
  }

  receiveMessage(message) {
    // Ignore own messages
    if (message.from === this.id) return;

    console.log(`[${this.name}] Received message:`, message);
    this.memory.push({ type: 'received', message, timestamp: Date.now() });

    // Process messages directed to this agent or broadcast
    if (message.to === this.id || message.to === 'all' || message.to === this.type) {
      this.processMessage(message);
    }
  }

  sendMessage(to, content, metadata = {}) {
    const message = {
      id: uuidv4(),
      from: this.id,
      fromName: this.name,
      fromType: this.type,
      to,
      content,
      metadata,
      timestamp: Date.now()
    };

    this.memory.push({ type: 'sent', message, timestamp: Date.now() });
    this.messageBus.publish(message);
    return message;
  }

  processMessage(message) {
    // Override in subclasses
    console.log(`[${this.name}] Processing message:`, message.content);
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      memoryCount: this.memory.length
    };
  }

  getMemory(limit = 50) {
    return this.memory.slice(-limit);
  }
}

// Coordinator Agent - Routes tasks and manages workflow
class CoordinatorAgent extends Agent {
  constructor(messageBus) {
    super('Coordinator', 'coordinator', messageBus);
    this.tasks = [];
    this.agentRegistry = new Map();
  }

  registerAgent(agent) {
    this.agentRegistry.set(agent.id, {
      id: agent.id,
      name: agent.name,
      type: agent.type
    });
    console.log(`[Coordinator] Registered agent: ${agent.name}`);
  }

  processMessage(message) {
    const { content, metadata } = message;

    if (content.type === 'task') {
      this.handleTask(content.task, message.from);
    } else if (content.type === 'status_update') {
      console.log(`[Coordinator] Status update from ${message.fromName}:`, content.status);
    }
  }

  handleTask(task, requesterId) {
    console.log(`[Coordinator] Handling task:`, task);
    this.status = 'working';

    const taskId = uuidv4();
    this.tasks.push({ id: taskId, task, requesterId, status: 'processing' });

    // Route task to appropriate agent
    if (task.includes('code') || task.includes('function') || task.includes('implement')) {
      this.sendMessage('code', {
        type: 'task',
        taskId,
        task,
        requesterId
      });
    } else if (task.includes('research') || task.includes('find') || task.includes('search')) {
      this.sendMessage('research', {
        type: 'task',
        taskId,
        task,
        requesterId
      });
    } else if (task.includes('test') || task.includes('validate')) {
      this.sendMessage('testing', {
        type: 'task',
        taskId,
        task,
        requesterId
      });
    } else {
      // Broadcast to all agents
      this.sendMessage('all', {
        type: 'task',
        taskId,
        task,
        requesterId,
        note: 'General task - any agent can respond'
      });
    }

    this.status = 'idle';
  }

  getTasks() {
    return this.tasks;
  }
}

// Code Agent - Handles code generation and analysis
class CodeAgent extends Agent {
  constructor(messageBus) {
    super('CodeMaster', 'code', messageBus);
    this.codeGenerated = [];
  }

  processMessage(message) {
    const { content } = message;

    if (content.type === 'task') {
      this.handleCodeTask(content.task, content.taskId);
    } else if (content.type === 'review_request') {
      this.reviewCode(content.code, message.from);
    }
  }

  handleCodeTask(task, taskId) {
    this.status = 'coding';
    console.log(`[CodeMaster] Working on: ${task}`);

    // Simulate code generation
    setTimeout(() => {
      const code = this.generateCode(task);
      this.codeGenerated.push({ taskId, task, code, timestamp: Date.now() });

      // Send result back to coordinator
      this.sendMessage('coordinator', {
        type: 'task_complete',
        taskId,
        result: code,
        agent: this.name
      });

      // Ask testing agent to validate
      this.sendMessage('testing', {
        type: 'test_request',
        taskId,
        code
      });

      this.status = 'idle';
    }, 1000);
  }

  generateCode(task) {
    // Simple code generation based on task
    return `// Generated code for: ${task}\nfunction solution() {\n  // Implementation here\n  console.log('Task: ${task}');\n  return 'completed';\n}\n\nmodule.exports = solution;`;
  }

  reviewCode(code, requesterId) {
    const review = {
      approved: true,
      suggestions: ['Consider adding error handling', 'Add type checks'],
      timestamp: Date.now()
    };

    this.sendMessage(requesterId, {
      type: 'review_result',
      review
    });
  }
}

// Research Agent - Performs research and information gathering
class ResearchAgent extends Agent {
  constructor(messageBus) {
    super('Researcher', 'research', messageBus);
    this.findings = [];
  }

  processMessage(message) {
    const { content } = message;

    if (content.type === 'task') {
      this.handleResearchTask(content.task, content.taskId);
    }
  }

  handleResearchTask(task, taskId) {
    this.status = 'researching';
    console.log(`[Researcher] Researching: ${task}`);

    setTimeout(() => {
      const findings = this.performResearch(task);
      this.findings.push({ taskId, task, findings, timestamp: Date.now() });

      this.sendMessage('coordinator', {
        type: 'task_complete',
        taskId,
        result: findings,
        agent: this.name
      });

      this.status = 'idle';
    }, 1500);
  }

  performResearch(task) {
    return {
      summary: `Research findings for: ${task}`,
      sources: ['Source 1', 'Source 2', 'Source 3'],
      insights: [
        'Key insight 1 about the task',
        'Important consideration 2',
        'Recommendation 3'
      ],
      confidence: 0.85
    };
  }
}

// Testing Agent - Runs tests and validates code
class TestingAgent extends Agent {
  constructor(messageBus) {
    super('Tester', 'testing', messageBus);
    this.testResults = [];
  }

  processMessage(message) {
    const { content } = message;

    if (content.type === 'task' || content.type === 'test_request') {
      this.handleTestTask(content.task || 'Code validation', content.taskId, content.code);
    }
  }

  handleTestTask(task, taskId, code) {
    this.status = 'testing';
    console.log(`[Tester] Testing: ${task}`);

    setTimeout(() => {
      const results = this.runTests(code || task);
      this.testResults.push({ taskId, task, results, timestamp: Date.now() });

      this.sendMessage('coordinator', {
        type: 'task_complete',
        taskId,
        result: results,
        agent: this.name
      });

      // If tests pass, notify code agent
      if (results.passed) {
        this.sendMessage('code', {
          type: 'test_passed',
          taskId,
          message: 'All tests passed!'
        });
      }

      this.status = 'idle';
    }, 800);
  }

  runTests(code) {
    return {
      passed: true,
      total: 5,
      successful: 5,
      failed: 0,
      details: [
        { test: 'Syntax validation', status: 'passed' },
        { test: 'Logic check', status: 'passed' },
        { test: 'Error handling', status: 'passed' },
        { test: 'Performance test', status: 'passed' },
        { test: 'Integration test', status: 'passed' }
      ]
    };
  }
}

// Agent Manager
class AgentManager {
  constructor() {
    this.messageBus = new MessageBus();
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    // Create coordinator first
    const coordinator = new CoordinatorAgent(this.messageBus);
    this.agents.set('coordinator', coordinator);

    // Create specialized agents
    const codeAgent = new CodeAgent(this.messageBus);
    const researchAgent = new ResearchAgent(this.messageBus);
    const testingAgent = new TestingAgent(this.messageBus);

    this.agents.set('code', codeAgent);
    this.agents.set('research', researchAgent);
    this.agents.set('testing', testingAgent);

    // Register all agents with coordinator
    coordinator.registerAgent(codeAgent);
    coordinator.registerAgent(researchAgent);
    coordinator.registerAgent(testingAgent);

    console.log('[AgentManager] All agents initialized and registered');
  }

  submitTask(task) {
    const coordinator = this.agents.get('coordinator');
    return coordinator.handleTask(task, 'user');
  }

  getAgentStatuses() {
    const statuses = {};
    for (const [key, agent] of this.agents.entries()) {
      statuses[key] = agent.getStatus();
    }
    return statuses;
  }

  getAgentMemory(agentType, limit = 50) {
    const agent = this.agents.get(agentType);
    return agent ? agent.getMemory(limit) : [];
  }

  getAllMessages(limit = 100) {
    const allMessages = [];
    for (const [key, agent] of this.agents.entries()) {
      const memory = agent.getMemory(limit);
      allMessages.push(...memory);
    }
    // Sort by timestamp
    return allMessages.sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
  }
}

module.exports = { AgentManager };
