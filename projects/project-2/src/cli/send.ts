#!/usr/bin/env node
/**
 * CLI tool to send a message through the persistent message bus.
 * Usage: node dist/cli/send.js --from project2-coder --to project2-master --topic status --type status --payload '{"msg":"hello"}'
 */
import { PersistentMessageBus } from "../bus/persistent-bus.js";
import type { AgentId, MessageType, MessagePriority } from "../types/index.js";

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

if (!opts.from || !opts.to || !opts.topic) {
  console.error(
    "Usage: send --from <agentId> --to <agentId> --topic <topic> [--type <type>] [--priority <priority>] [--payload <json>]"
  );
  process.exit(1);
}

const bus = new PersistentMessageBus();

let payload: unknown = opts.payload ?? null;
if (typeof payload === "string") {
  try {
    payload = JSON.parse(payload);
  } catch {
    // keep as string
  }
}

const msg = bus.publish({
  type: (opts.type as MessageType) ?? "command",
  from: opts.from as AgentId,
  to: opts.to as AgentId,
  topic: opts.topic,
  payload,
  priority: (opts.priority as MessagePriority) ?? "normal",
});

console.log(`Message sent: ${msg.id}`);
console.log(JSON.stringify(msg, null, 2));
