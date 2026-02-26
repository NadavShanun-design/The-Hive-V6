/** Core message types for THE HIVE inter-agent communication system */

export type AgentId =
  | "project1-master"
  | "project1-coder"
  | "project2-master"
  | "project2-coder"
  | "project3-master"
  | "project3-coder"
  | "moltbot"
  | "broadcast";

export type MessageType =
  | "instruction"
  | "status"
  | "heartbeat"
  | "event"
  | "command"
  | "response"
  | "error";

export type MessagePriority = "low" | "normal" | "high" | "critical";

export interface Message {
  id: string;
  type: MessageType;
  from: AgentId;
  to: AgentId;
  topic: string;
  payload: unknown;
  priority: MessagePriority;
  timestamp: string;
  correlationId?: string;
  replyTo?: string;
}

export interface Subscription {
  id: string;
  topic: string;
  subscriber: AgentId;
  handler: (message: Message) => void;
  filter?: (message: Message) => boolean;
}

export interface AgentStatus {
  agentId: AgentId;
  status: "online" | "offline" | "busy" | "idle";
  lastHeartbeat: string;
  currentTask?: string;
}
