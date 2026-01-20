/**
 * 统一日志管理
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO
  private static prefix = '[WaferMap]'

  static setLevel(level: LogLevel) {
    this.level = level
  }

  static setPrefix(prefix: string) {
    this.prefix = prefix
  }

  static debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} ${message}`, ...args)
    }
  }

  static info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} ${message}`, ...args)
    }
  }

  static warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} ${message}`, ...args)
    }
  }

  static error(message: string, error?: Error) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} ${message}`, error)
    }
  }

  static group(label: string) {
    if (this.level <= LogLevel.DEBUG) {
      console.group(`${this.prefix} ${label}`)
    }
  }

  static groupEnd() {
    if (this.level <= LogLevel.DEBUG) {
      console.groupEnd()
    }
  }

  static table(data: unknown) {
    if (this.level <= LogLevel.DEBUG) {
      console.table(data)
    }
  }
}

// 开发环境默认 DEBUG，生产环境默认 WARN
if (import.meta.env.DEV) {
  Logger.setLevel(LogLevel.DEBUG)
} else {
  Logger.setLevel(LogLevel.WARN)
}
