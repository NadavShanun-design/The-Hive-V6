import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Message } from "../types/index.js";

export class FileMessageStore {
  private filePath: string;

  constructor(storagePath?: string) {
    this.filePath =
      storagePath ?? join(process.cwd(), ".hive-messages", "messages.json");
  }

  async save(messages: Message[]): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(messages, null, 2), "utf-8");
  }

  async load(): Promise<Message[]> {
    if (!existsSync(this.filePath)) {
      return [];
    }
    const data = await readFile(this.filePath, "utf-8");
    return JSON.parse(data) as Message[];
  }

  async append(message: Message): Promise<void> {
    const messages = await this.load();
    messages.push(message);
    await this.save(messages);
  }
}
