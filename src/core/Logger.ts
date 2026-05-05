export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export class Logger {
  private static logs: LogEntry[] = [];

  // Parses arguments just like console.log would
  private static formatArgs(args: any[]): { message: string; details?: string } {
    if (args.length === 0) return { message: "" };

    let message = "";
    if (typeof args[0] === "string") {
      message = args[0];
    } else if (args[0] instanceof Error) {
      message = args[0].message;
    } else {
      message = JSON.stringify(args[0]);
    }

    let details: string | undefined = undefined;

    if (args.length > 1) {
      details = args
        .slice(1)
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.stack || arg.message;
          }
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join("\n");
    } else if (args[0] instanceof Error && args[0].stack) {
      details = args[0].stack;
    }

    return { message, details };
  }

  private static addLog(level: LogLevel, ...args: any[]) {
    const { message, details } = this.formatArgs(args);
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    // Keep memory in check (max 1000 logs)
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    this.logs.push(entry);
    return { message, details };
  }

  static info(...args: any[]) {
    const { message, details } = this.addLog("INFO", ...args);
    // 実際にコンソールにも出力する（SSR時のコンソール確認用）
    if (details) {
      console.info(message, details);
    } else {
      console.info(message);
    }
  }

  static warn(...args: any[]) {
    const { message, details } = this.addLog("WARN", ...args);
    if (details) {
      console.warn(message, details);
    } else {
      console.warn(message);
    }
  }

  static error(...args: any[]) {
    const { message, details } = this.addLog("ERROR", ...args);
    if (details) {
      console.error(message, details);
    } else {
      console.error(message);
    }
  }

  // ログを取得する
  static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // ログをクリアする
  static clearLogs() {
    this.logs = [];
  }
}
