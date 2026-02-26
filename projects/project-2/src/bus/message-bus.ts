import { generateId } from "../utils/id.js";
import type { Message, Subscription, AgentId, MessageType, MessagePriority } from "../types/index.js";

export class MessageBus {
  private subscriptions = new Map<string, Subscription>();
  private messageLog: Message[] = [];

  subscribe(
    topic: string,
    subscriber: AgentId,
    handler: (message: Message) => void,
    filter?: (message: Message) => boolean
  ): string {
    const id = generateId();
    this.subscriptions.set(id, { id, topic, subscriber, handler, filter });
    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  publish(params: {
    type: MessageType;
    from: AgentId;
    to: AgentId;
    topic: string;
    payload: unknown;
    priority?: MessagePriority;
    correlationId?: string;
    replyTo?: string;
  }): Message {
    const message: Message = {
      id: generateId(),
      type: params.type,
      from: params.from,
      to: params.to,
      topic: params.topic,
      payload: params.payload,
      priority: params.priority ?? "normal",
      timestamp: new Date().toISOString(),
      correlationId: params.correlationId,
      replyTo: params.replyTo,
    };

    this.messageLog.push(message);
    this.deliver(message);
    return message;
  }

  private deliver(message: Message): void {
    for (const sub of this.subscriptions.values()) {
      const topicMatch =
        sub.topic === "*" || sub.topic === message.topic;
      const recipientMatch =
        message.to === "broadcast" || message.to === sub.subscriber;

      if (topicMatch && recipientMatch) {
        if (!sub.filter || sub.filter(message)) {
          try {
            sub.handler(message);
          } catch (err) {
            console.error(
              `[MessageBus] Handler error for subscription ${sub.id}:`,
              err
            );
          }
        }
      }
    }
  }

  getMessages(opts?: {
    topic?: string;
    from?: AgentId;
    to?: AgentId;
    type?: MessageType;
    since?: string;
    limit?: number;
  }): Message[] {
    let result = this.messageLog;

    if (opts?.topic) result = result.filter((m) => m.topic === opts.topic);
    if (opts?.from) result = result.filter((m) => m.from === opts.from);
    if (opts?.to) result = result.filter((m) => m.to === opts.to);
    if (opts?.type) result = result.filter((m) => m.type === opts.type);
    if (opts?.since)
      result = result.filter((m) => m.timestamp >= opts.since!);
    if (opts?.limit) result = result.slice(-opts.limit);

    return result;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getMessageCount(): number {
    return this.messageLog.length;
  }
}
