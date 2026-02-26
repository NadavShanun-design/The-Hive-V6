import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MessageBus } from "./message-bus.js";

describe("MessageBus", () => {
  it("publishes and delivers messages to subscribers", () => {
    const bus = new MessageBus();
    const received: unknown[] = [];

    bus.subscribe("tasks", "project2-coder", (msg) => {
      received.push(msg.payload);
    });

    bus.publish({
      type: "instruction",
      from: "project2-master",
      to: "project2-coder",
      topic: "tasks",
      payload: { task: "implement feature X" },
    });

    assert.equal(received.length, 1);
    assert.deepEqual(received[0], { task: "implement feature X" });
  });

  it("delivers broadcast messages to all subscribers", () => {
    const bus = new MessageBus();
    const receivedA: unknown[] = [];
    const receivedB: unknown[] = [];

    bus.subscribe("announce", "project1-master", (msg) => {
      receivedA.push(msg.payload);
    });

    bus.subscribe("announce", "project2-coder", (msg) => {
      receivedB.push(msg.payload);
    });

    bus.publish({
      type: "event",
      from: "moltbot",
      to: "broadcast",
      topic: "announce",
      payload: "deploy starting",
    });

    assert.equal(receivedA.length, 1);
    assert.equal(receivedB.length, 1);
  });

  it("does not deliver to non-matching topics", () => {
    const bus = new MessageBus();
    const received: unknown[] = [];

    bus.subscribe("tasks", "project2-coder", (msg) => {
      received.push(msg.payload);
    });

    bus.publish({
      type: "status",
      from: "project2-master",
      to: "project2-coder",
      topic: "status-updates",
      payload: "idle",
    });

    assert.equal(received.length, 0);
  });

  it("wildcard topic subscription receives all messages", () => {
    const bus = new MessageBus();
    const received: unknown[] = [];

    bus.subscribe("*", "project2-coder", (msg) => {
      received.push(msg.payload);
    });

    bus.publish({
      type: "command",
      from: "moltbot",
      to: "project2-coder",
      topic: "anything",
      payload: "hello",
    });

    assert.equal(received.length, 1);
  });

  it("unsubscribe stops delivery", () => {
    const bus = new MessageBus();
    const received: unknown[] = [];

    const subId = bus.subscribe("tasks", "project2-coder", (msg) => {
      received.push(msg.payload);
    });

    bus.publish({
      type: "command",
      from: "project2-master",
      to: "project2-coder",
      topic: "tasks",
      payload: "first",
    });

    bus.unsubscribe(subId);

    bus.publish({
      type: "command",
      from: "project2-master",
      to: "project2-coder",
      topic: "tasks",
      payload: "second",
    });

    assert.equal(received.length, 1);
    assert.equal(received[0], "first");
  });

  it("getMessages filters by topic and from", () => {
    const bus = new MessageBus();

    bus.publish({
      type: "status",
      from: "project1-master",
      to: "broadcast",
      topic: "heartbeat",
      payload: null,
    });

    bus.publish({
      type: "command",
      from: "project2-master",
      to: "project2-coder",
      topic: "tasks",
      payload: "do it",
    });

    const heartbeats = bus.getMessages({ topic: "heartbeat" });
    assert.equal(heartbeats.length, 1);

    const fromP2 = bus.getMessages({ from: "project2-master" });
    assert.equal(fromP2.length, 1);
  });
});
