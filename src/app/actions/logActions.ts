"use server";

import { Logger, LogEntry } from "@/core/Logger";

export async function getLogsAction(): Promise<LogEntry[]> {
  // Next.jsのServer Action経由でサーバー上のログを返す
  return Logger.getLogs();
}

export async function clearLogsAction(): Promise<void> {
  Logger.clearLogs();
}
