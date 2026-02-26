#!/usr/bin/env node
/**
 * CLI tool to read persisted messages with optional filters.
 * Usage: node dist/cli/listen.js [--topic <topic>] [--from <agentId>] [--to <agentId>] [--limit <n>]
 */
import { PersistentMessageBus } from "../bus/persistent-bus.js";
import type { AgentId } from "../types/index.js";

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

const opts = parseArgs(process.argv.slice(2));
const bus = new PersistentMessageBus();

async function main() {
  const messages = await bus.loadHistory();

  let filtered = messages;
  if (opts.topic) filtered = filtered.filter((m) => m.topic === opts.topic);
  if (opts.from)
    filtered = filtered.filter((m) => m.from === (opts.from as AgentId));
  if (opts.to)
    filtered = filtered.filter((m) => m.to === (opts.to as AgentId));
  if (opts.limit) filtered = filtered.slice(-Number(opts.limit));

  if (filtered.length === 0) {
    console.log("No messages found.");
  } else {
    console.log(`Found ${filtered.length} message(s):\n`);
    for (const msg of filtered) {
      console.log(
        `[${msg.timestamp}] ${msg.from} -> ${msg.to} (${msg.topic}/${msg.type})`
      );
      console.log(`  ID: ${msg.id}`);
      console.log(`  Payload: ${JSON.stringify(msg.payload)}`);
      console.log();
    }
  }
}

main().catch(console.error);
