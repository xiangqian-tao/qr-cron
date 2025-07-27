/** Quartz 执行时间对象 */
export interface ExecutionTime {
  index: number;
  time: Date;
  formatted: string;
}

/** Quartz Cron 解析结构 */
export interface CronExpression {
  second: number[];
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
  year?: number[];
}

/** 校验结果 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/** Cron 字段定义 */
export interface CronField {
  name: string;
  min: number;
  max: number;
  allowedChars: string[];
}
