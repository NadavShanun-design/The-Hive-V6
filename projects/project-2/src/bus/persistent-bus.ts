import { MessageBus } from "./message-bus.js";
import { FileMessageStore } from "../persistence/file-store.js";
import type { Message, AgentId, MessageType, MessagePriority } from "../types/index.js";

export class PersistentMessageBus extends MessageBus {
  private store: FileMessageStore;

  constructor(storagePath?: string) {
    super();
    this.store = new FileMessageStore(storagePath);
  }

  override publish(params: {
    type: MessageType;
    from: AgentId;
    to: AgentId;
    topic: string;
    payload: unknown;
    priority?: MessagePriority;
    correlationId?: string;
    replyTo?: string;
  }): Message {
    const message = super.publish(params);
    // Fire-and-forget persistence — don't block publish
    this.store.append(message).catch((err) => {
      console.error("[PersistentMessageBus] Failed to persist message:", err);
    });
    return message;
  }

  async loadHistory(): Promise<Message[]> {
    return this.store.load();
  }
}
