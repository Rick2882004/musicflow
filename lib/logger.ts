type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

function printLog({ level, message, timestamp, context, error }: LogPayload) {
  const isProd = process.env.NODE_ENV === "production";
  
  const payload: LogPayload = {
    level,
    message,
    timestamp,
    context: context ? { ...context } : undefined,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  };

  if (isProd) {
    // Structured JSON log format for production log aggregators (e.g. Datadog, CloudWatch, Stackdriver)
    console.log(JSON.stringify(payload));
  } else {
    // Human-friendly colorful log messages in local shell console
    const color = level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[32m";
    const reset = "\x1b[0m";
    console.log(`[${timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}`);
    if (context) {
      console.log(JSON.stringify(context, null, 2));
    }
    if (error) {
      console.error(error);
    }
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    printLog({ level: "info", message, timestamp: new Date().toISOString(), context });
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    printLog({ level: "warn", message, timestamp: new Date().toISOString(), context });
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    printLog({ level: "error", message, timestamp: new Date().toISOString(), error, context });
  },
};
