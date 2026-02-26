#!/usr/bin/env node

/**
 * Memory CLI Tool for Agents
 *
 * Usage:
 *   node memory-cli.js <agent-name> <command> [options]
 *
 * Commands:
 *   show - Show memory summary
 *   history - Show prompt history
 *   search <keyword> - Search prompts
 *   export - Export all memory
 *   clear - Clear memory
 *
 * Examples:
 *   node memory-cli.js master show
 *   node memory-cli.js coder history
 *   node memory-cli.js researcher search "authentication"
 */

const MemoryManager = require('./memory-manager');

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node memory-cli.js <agent-name> <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  show                 - Show memory summary');
    console.log('  history [limit]      - Show prompt history (default: 10)');
    console.log('  search <keyword>     - Search prompts by keyword');
    console.log('  export               - Export all memory as JSON');
    console.log('  clear                - Clear all memory');
    console.log('  context              - Show current context');
    console.log('');
    console.log('Agents: master, coder, researcher, tester, file_manager');
    process.exit(1);
}

const agentName = args[0];
const command = args[1];
const option = args[2];

const validAgents = ['master', 'coder', 'researcher', 'tester', 'file_manager'];

if (!validAgents.includes(agentName)) {
    console.error(`Invalid agent name: ${agentName}`);
    console.error(`Valid agents: ${validAgents.join(', ')}`);
    process.exit(1);
}

const memory = new MemoryManager(agentName);

switch (command) {
    case 'show':
        console.log(memory.getMemorySummary());
        break;

    case 'history':
        const limit = option ? parseInt(option) : 10;
        const history = memory.getLastPrompts(limit);
        console.log(`\n=== ${agentName.toUpperCase()} Prompt History (Last ${limit}) ===\n`);
        history.forEach((entry, idx) => {
            console.log(`${idx + 1}. [${new Date(entry.timestamp).toLocaleString()}]`);
            console.log(`   Prompt: ${entry.prompt}`);
            if (entry.response) {
                console.log(`   Response: ${entry.response.substring(0, 100)}...`);
            }
            console.log('');
        });
        break;

    case 'search':
        if (!option) {
            console.error('Please provide a search keyword');
            process.exit(1);
        }
        const results = memory.searchPrompts(option);
        console.log(`\n=== Search Results for "${option}" in ${agentName.toUpperCase()} ===\n`);
        console.log(`Found ${results.length} matches\n`);
        results.forEach((entry, idx) => {
            console.log(`${idx + 1}. [${new Date(entry.timestamp).toLocaleString()}]`);
            console.log(`   Prompt: ${entry.prompt}`);
            console.log('');
        });
        break;

    case 'export':
        const exportData = memory.exportMemory();
        console.log(JSON.stringify(exportData, null, 2));
        break;

    case 'clear':
        console.log(`Clearing memory for ${agentName}...`);
        const success = memory.clearMemory();
        if (success) {
            console.log('✓ Memory cleared successfully');
        } else {
            console.error('✗ Failed to clear memory');
        }
        break;

    case 'context':
        const context = memory.getContext();
        console.log(`\n=== ${agentName.toUpperCase()} Current Context ===\n`);
        console.log(JSON.stringify(context, null, 2));
        break;

    default:
        console.error(`Unknown command: ${command}`);
        console.log('Valid commands: show, history, search, export, clear, context');
        process.exit(1);
}
