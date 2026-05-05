"use server";

import { Logger, LogEntry } from "@/core/Logger";

export async function getLogsAction(): Promise<LogEntry[]> {
  // Next.jsのServer Action経由でサーバー上のログを返す
  return Logger.getLogs();
}

export async function clearLogsAction(): Promise<void> {
  Logger.clearLogs();
  Logger.info("[ユーザー操作] システムログが手動でクリアされました。");
}

export async function addClientLogAction(level: "INFO" | "WARN" | "ERROR", message: string): Promise<void> {
  if (level === "INFO") Logger.info(message);
  else if (level === "WARN") Logger.warn(message);
  else if (level === "ERROR") Logger.error(message);
}
