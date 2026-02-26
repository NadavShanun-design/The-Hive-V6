#!/usr/bin/env node

/**
 * Auto-Prompt System - Automatically sends commands to agent terminals
 * Enables master to directly prompt worker terminals via node-pty
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname);
const MESSAGES_DIR = path.join(WORKSPACE, 'messages');
const TASKS_DIR = path.join(WORKSPACE, 'tasks');
const OUTPUTS_DIR = path.join(WORKSPACE, 'outputs');

class AutoPromptSystem {
  constructor(wsPort = 3000) {
    this.wsPort = wsPort;
    this.connections = new Map(); // agentName -> WebSocket connection
    this.taskQueue = new Map(); // taskId -> task details
    this.completedTasks = new Map(); // taskId -> result
  }

  /**
   * Connect to the terminal server to send commands
   */
  connectToServer() {
    // In production, this would connect to the WebSocket server
    // For now, we'll use the file-based system
    console.log('Auto-prompt system initialized');
  }

  /**
   * Send command directly to an agent's terminal
   * @param {string} agentName - Target agent
   * @param {string} command - Command to execute
   * @param {string} taskId - Unique task identifier
   */
  async promptAgent(agentName, command, taskId = null) {
    taskId = taskId || `task-${Date.now()}`;

    // Create task record
    const task = {
      id: taskId,
      agent: agentName,
      command: command,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      result: null
    };

    // Save task to queue
    this.taskQueue.set(taskId, task);
    const taskFile = path.join(TASKS_DIR, `${taskId}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));

    // Create command file that agent can detect and execute
    const commandFile = path.join(MESSAGES_DIR, agentName, `__command_${taskId}.json`);
    const commandObj = {
      type: 'auto_prompt',
      taskId: taskId,
      command: command,
      timestamp: new Date().toISOString(),
      needsResponse: true
    };

    fs.writeFileSync(commandFile, JSON.stringify(commandObj, null, 2));

    console.log(`✓ Auto-prompt sent to ${agentName}: "${command}"`);
    console.log(`  Task ID: ${taskId}`);
    console.log(`  Command file: ${commandFile}`);

    return taskId;
  }

  /**
   * Broadcast command to multiple agents in parallel
   */
  async promptAgentsParallel(agents, command) {
    const baseTaskId = `parallel-${Date.now()}`;
    const taskIds = [];

    for (let i = 0; i < agents.length; i++) {
      const taskId = `${baseTaskId}-${agents[i]}`;
      await this.promptAgent(agents[i], command, taskId);
      taskIds.push(taskId);
    }

    console.log(`✓ Parallel prompts sent to ${agents.length} agents`);
    return taskIds;
  }

  /**
   * Mark task as completed with result
   */
  completeTask(taskId, result) {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;

    this.completedTasks.set(taskId, task);
    this.taskQueue.delete(taskId);

    // Update task file
    const taskFile = path.join(TASKS_DIR, `${taskId}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));

    // Save result
    const resultFile = path.join(OUTPUTS_DIR, `${taskId}-result.json`);
    fs.writeFileSync(resultFile, JSON.stringify({ taskId, result }, null, 2));

    console.log(`✓ Task ${taskId} completed`);
  }

  /**
   * Wait for all tasks to complete
   * @param {Array<string>} taskIds - Task IDs to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForCompletion(taskIds, timeout = 300000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const allComplete = taskIds.every(id => this.completedTasks.has(id));
      
      if (allComplete) {
        console.log(`✓ All ${taskIds.length} tasks completed`);
        return taskIds.map(id => this.completedTasks.get(id));
      }

      // Check for completed tasks
      for (const taskId of taskIds) {
        if (!this.completedTasks.has(taskId)) {
          const resultFile = path.join(OUTPUTS_DIR, `${taskId}-result.json`);
          if (fs.existsSync(resultFile)) {
            const resultData = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
            this.completeTask(taskId, resultData.result);
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Timeout waiting for tasks: ${taskIds.join(', ')}`);
  }

  /**
   * Aggregate results from multiple completed tasks
   */
  aggregateResults(taskIds) {
    const results = {};
    
    for (const taskId of taskIds) {
      const task = this.completedTasks.get(taskId);
      if (task) {
        results[task.agent] = task.result;
      }
    }

    return results;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    if (this.completedTasks.has(taskId)) {
      return 'completed';
    } else if (this.taskQueue.has(taskId)) {
      return 'pending';
    } else {
      return 'unknown';
    }
  }

  /**
   * List all active tasks
   */
  listActiveTasks() {
    return Array.from(this.taskQueue.values());
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const system = new AutoPromptSystem();

  if (!command) {
    console.log(`
Auto-Prompt System CLI

Usage:
  node auto-prompt.js prompt <agent> "<command>"
  node auto-prompt.js parallel <agent1,agent2,...> "<command>"
  node auto-prompt.js status <taskId>
  node auto-prompt.js wait <taskId1,taskId2,...>
  node auto-prompt.js aggregate <taskId1,taskId2,...>

Examples:
  node auto-prompt.js prompt coder "Implement the login function"
  node auto-prompt.js parallel coder,researcher "Analyze the authentication system"
  node auto-prompt.js status task-1234567890
  node auto-prompt.js wait task-123,task-456
`);
    process.exit(0);
  }

  if (command === 'prompt') {
    const [_, agent, cmdText] = args;
    system.promptAgent(agent, cmdText).then(taskId => {
      console.log(`Task ID: ${taskId}`);
    });
  } else if (command === 'parallel') {
    const [_, agentsStr, cmdText] = args;
    const agents = agentsStr.split(',');
    system.promptAgentsParallel(agents, cmdText).then(taskIds => {
      console.log(`Task IDs: ${taskIds.join(', ')}`);
    });
  } else if (command === 'status') {
    const [_, taskId] = args;
    console.log(`Status: ${system.getTaskStatus(taskId)}`);
  } else if (command === 'wait') {
    const [_, taskIdsStr] = args;
    const taskIds = taskIdsStr.split(',');
    system.waitForCompletion(taskIds).then(results => {
      console.log('All tasks completed:', JSON.stringify(results, null, 2));
    });
  } else if (command === 'aggregate') {
    const [_, taskIdsStr] = args;
    const taskIds = taskIdsStr.split(',');
    const results = system.aggregateResults(taskIds);
    console.log('Aggregated results:', JSON.stringify(results, null, 2));
  }
}

module.exports = AutoPromptSystem;
