const fs = require('fs');
const path = require('path');

class MemoryManager {
  constructor(agentName) {
    this.agentName = agentName;
    this.memoryDir = path.join(__dirname, 'agent-memory', agentName);
    this.promptHistoryFile = path.join(this.memoryDir, 'prompt-history.json');
    this.memorySummaryFile = path.join(this.memoryDir, 'memory-summary.md');
    this.contextFile = path.join(this.memoryDir, 'context.json');

    // Ensure directory exists
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    // Initialize files if they don't exist
    this.initializeFiles();
  }

  initializeFiles() {
    if (!fs.existsSync(this.promptHistoryFile)) {
      fs.writeFileSync(this.promptHistoryFile, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(this.memorySummaryFile)) {
      const initialSummary = `# ${this.agentName.toUpperCase()} Agent Memory\n\n## Role\n${this.getRoleDescription()}\n\n## Recent Activity Summary\nNo activity yet.\n\n## Key Context\n- Agent initialized\n- Awaiting first interaction\n`;
      fs.writeFileSync(this.memorySummaryFile, initialSummary);
    }

    if (!fs.existsSync(this.contextFile)) {
      const initialContext = {
        agentName: this.agentName,
        role: this.getRoleDescription(),
        currentWorkingDirectory: process.cwd(),
        currentFiles: [],
        lastUpdated: new Date().toISOString(),
        sessionCount: 0
      };
      fs.writeFileSync(this.contextFile, JSON.stringify(initialContext, null, 2));
    }
  }

  getRoleDescription() {
    const roles = {
      master: 'Orchestrates and coordinates tasks across all agents',
      coder: 'Writes and implements code, handles development tasks',
      researcher: 'Researches solutions, documentation, and best practices',
      tester: 'Tests code, writes tests, ensures quality',
      file_manager: 'Manages files, organizes project structure'
    };
    return roles[this.agentName] || 'General purpose agent';
  }

  // Save a new prompt to history
  savePrompt(prompt, response = '', metadata = {}) {
    try {
      const history = this.getPromptHistory();
      const entry = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        response: response,
        metadata: {
          cwd: metadata.cwd || process.cwd(),
          files: metadata.files || [],
          ...metadata
        }
      };

      history.push(entry);

      // Keep last 1000 prompts to avoid file getting too large
      if (history.length > 1000) {
        history.shift();
      }

      fs.writeFileSync(this.promptHistoryFile, JSON.stringify(history, null, 2));

      // Update context
      this.updateContext(entry);

      return true;
    } catch (error) {
      console.error(`Error saving prompt for ${this.agentName}:`, error);
      return false;
    }
  }

  // Get prompt history
  getPromptHistory(limit = null) {
    try {
      const data = fs.readFileSync(this.promptHistoryFile, 'utf8');
      const history = JSON.parse(data);

      if (limit) {
        return history.slice(-limit);
      }

      return history;
    } catch (error) {
      console.error(`Error reading prompt history for ${this.agentName}:`, error);
      return [];
    }
  }

  // Get last N prompts
  getLastPrompts(n = 10) {
    const history = this.getPromptHistory();
    return history.slice(-n);
  }

  // Update context
  updateContext(entry) {
    try {
      const context = this.getContext();
      context.lastPrompt = entry.prompt;
      context.lastResponse = entry.response;
      context.lastUpdated = entry.timestamp;
      context.currentWorkingDirectory = entry.metadata.cwd || context.currentWorkingDirectory;
      context.currentFiles = entry.metadata.files || context.currentFiles;
      context.sessionCount = (context.sessionCount || 0) + 1;

      fs.writeFileSync(this.contextFile, JSON.stringify(context, null, 2));
    } catch (error) {
      console.error(`Error updating context for ${this.agentName}:`, error);
    }
  }

  // Get current context
  getContext() {
    try {
      const data = fs.readFileSync(this.contextFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading context for ${this.agentName}:`, error);
      return {};
    }
  }

  // Update memory summary (markdown format for easy reading)
  updateMemorySummary(summary) {
    try {
      const timestamp = new Date().toISOString();
      const context = this.getContext();
      const recentPrompts = this.getLastPrompts(5);

      let memorySummary = `# ${this.agentName.toUpperCase()} Agent Memory\n\n`;
      memorySummary += `**Last Updated:** ${timestamp}\n\n`;
      memorySummary += `## Role\n${this.getRoleDescription()}\n\n`;
      memorySummary += `## Current Context\n`;
      memorySummary += `- **Working Directory:** ${context.currentWorkingDirectory}\n`;
      memorySummary += `- **Total Interactions:** ${context.sessionCount}\n`;
      memorySummary += `- **Last Activity:** ${context.lastUpdated}\n\n`;

      if (summary) {
        memorySummary += `## Summary\n${summary}\n\n`;
      }

      memorySummary += `## Recent Prompts (Last 5)\n\n`;
      recentPrompts.forEach((entry, idx) => {
        memorySummary += `### ${idx + 1}. ${new Date(entry.timestamp).toLocaleString()}\n`;
        memorySummary += `**Prompt:** ${entry.prompt.substring(0, 200)}${entry.prompt.length > 200 ? '...' : ''}\n\n`;
        if (entry.response) {
          memorySummary += `**Response:** ${entry.response.substring(0, 200)}${entry.response.length > 200 ? '...' : ''}\n\n`;
        }
      });

      if (context.currentFiles && context.currentFiles.length > 0) {
        memorySummary += `## Current Files\n`;
        context.currentFiles.forEach(file => {
          memorySummary += `- ${file}\n`;
        });
        memorySummary += `\n`;
      }

      fs.writeFileSync(this.memorySummaryFile, memorySummary);
      return true;
    } catch (error) {
      console.error(`Error updating memory summary for ${this.agentName}:`, error);
      return false;
    }
  }

  // Get memory summary
  getMemorySummary() {
    try {
      return fs.readFileSync(this.memorySummaryFile, 'utf8');
    } catch (error) {
      console.error(`Error reading memory summary for ${this.agentName}:`, error);
      return '';
    }
  }

  // Search prompts by keyword
  searchPrompts(keyword) {
    const history = this.getPromptHistory();
    return history.filter(entry =>
      entry.prompt.toLowerCase().includes(keyword.toLowerCase()) ||
      (entry.response && entry.response.toLowerCase().includes(keyword.toLowerCase()))
    );
  }

  // Export all memory data
  exportMemory() {
    return {
      agentName: this.agentName,
      context: this.getContext(),
      promptHistory: this.getPromptHistory(),
      memorySummary: this.getMemorySummary()
    };
  }

  // Clear all memory (use with caution)
  clearMemory() {
    try {
      fs.writeFileSync(this.promptHistoryFile, JSON.stringify([], null, 2));
      this.initializeFiles();
      return true;
    } catch (error) {
      console.error(`Error clearing memory for ${this.agentName}:`, error);
      return false;
    }
  }
}

module.exports = MemoryManager;
