import { MONTH_NAMES, DAY_NAMES, DAYS_IN_MONTH } from "../constants";
import type {
  ExecutionTime,
  CronExpression,
  ValidationResult,
  CronField,
} from "../interface/interfaces";

/**
 * 获取未来 N 次执行时间
 */
export function getNextExecutionTimes(
  expression: string,
  count: number = 5,
  startDate: Date = new Date(),
  timezone: string = "Asia/Shanghai"
): ExecutionTime[] {
  if (typeof expression !== "string" || !expression.trim()) {
    throw new Error("Cron 表达式不能为空");
  }
  if (count <= 0) throw new Error("count 必须为正整数");
  try {
    const cronExpr = parseCronExpression(expression);
    const executionTimes: ExecutionTime[] = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < count; i++) {
      const nextTime = findNextExecutionTime(cronExpr, currentDate);
      executionTimes.push({
        index: i + 1,
        time: nextTime,
        formatted: formatDate(nextTime, timezone),
      });
      currentDate = new Date(nextTime.getTime() + 1000); // 加1秒避免重复
    }
    return executionTimes;
  } catch (error) {
    throw new Error(
      `无法计算执行时间: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 获取下一次执行时间
 */
export function getNextExecutionTime(
  expression: string,
  startDate: Date = new Date(),
  timezone: string = "Asia/Shanghai"
): ExecutionTime {
  return getNextExecutionTimes(expression, 1, startDate, timezone)[0];
}

/**
 * 解析 Cron 表达式
 */
function parseCronExpression(expression: string): CronExpression {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 6 || parts.length > 7) {
    throw new Error("表达式必须包含6-7个字段");
  }
  return {
    second: parseField(parts[0], 0, 59, "second"),
    minute: parseField(parts[1], 0, 59, "minute"),
    hour: parseField(parts[2], 0, 23, "hour"),
    dayOfMonth: parseField(parts[3], 1, 31, "dayOfMonth"),
    month: parseField(parts[4], 1, 12, "month"),
    dayOfWeek: parseField(parts[5], 1, 7, "dayOfWeek"),
    year:
      parts.length === 7 ? parseField(parts[6], 1970, 2099, "year") : undefined,
  };
}

/**
 * 解析单个字段，支持范围、步长、列表、名称
 */
function parseField(
  part: string,
  min: number,
  max: number,
  fieldName: string
): number[] {
  if (part === "*" || part === "?") return generateRange(min, max);
  if (part.includes(",")) {
    // 用 Set 去重，避免多余数组
    const set = new Set<number>();
    part.split(",").forEach((item) => {
      parseField(item.trim(), min, max, fieldName).forEach((v) => set.add(v));
    });
    return Array.from(set).sort((a, b) => a - b);
  }
  if (part.includes("-")) {
    const [start, end] = part.split("-");
    return generateRange(
      parseValue(start, min, max, fieldName),
      parseValue(end, min, max, fieldName)
    );
  }
  if (part.includes("/")) {
    const [range, step] = part.split("/");
    const stepNum = parseInt(step, 10);
    if (isNaN(stepNum) || stepNum <= 0) throw new Error("步长必须是正整数");
    const rangeValues = parseField(range, min, max, fieldName);
    const result: number[] = [];
    for (let i = 0, len = rangeValues.length; i < len; i += stepNum) {
      result.push(rangeValues[i]);
    }
    return result;
  }
  return [parseValue(part, min, max, fieldName)];
}

/**
 * 解析单个值，支持名称
 */
function parseValue(
  part: string,
  min: number,
  max: number,
  fieldName: string
): number {
  const upper = part.toUpperCase();
  if (fieldName === "month" && MONTH_NAMES[upper]) return MONTH_NAMES[upper];
  if (fieldName === "dayOfWeek" && DAY_NAMES[upper]) return DAY_NAMES[upper];
  const num = parseInt(part, 10);
  if (isNaN(num)) throw new Error(`无效的数字: ${part}`);
  if (num < min || num > max)
    throw new Error(`值必须在 ${min}-${max} 范围内，当前值: ${num}`);
  return num;
}

/**
 * 生成范围数组（更高效，避免 push）
 */
function generateRange(start: number, end: number): number[] {
  if (start > end) throw new Error(`范围起始值不能大于结束值: ${start}-${end}`);
  const len = end - start + 1;
  const arr = new Array(len);
  for (let i = 0; i < len; i++) arr[i] = start + i;
  return arr;
}

/**
 * 查找下一次执行时间（高效跳跃）
 */
function findNextExecutionTime(
  cronExpr: CronExpression,
  startDate: Date
): Date {
  let current = new Date(startDate.getTime());
  current.setMilliseconds(0);
  const MAX_ITER = 100000;
  let iter = 0;
  while (iter++ < MAX_ITER) {
    if (cronExpr.year && !cronExpr.year.includes(current.getFullYear())) {
      const nextYear = cronExpr.year.find((y) => y > current.getFullYear());
      if (nextYear === undefined) throw new Error("没有匹配的年份");
      current = new Date(nextYear, 0, 1, 0, 0, 0, 0);
      continue;
    }
    if (!cronExpr.month.includes(current.getMonth() + 1)) {
      const nextMonth = cronExpr.month.find((m) => m > current.getMonth() + 1);
      if (nextMonth === undefined) {
        current = new Date(current.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      } else {
        current = new Date(current.getFullYear(), nextMonth - 1, 1, 0, 0, 0, 0);
      }
      continue;
    }
    // 优先跳转 dayOfWeek
    if (
      cronExpr.dayOfWeek.length &&
      !cronExpr.dayOfWeek.includes(
        current.getDay() === 0 ? 1 : current.getDay() + 1
      )
    ) {
      const jsDow = current.getDay();
      let minDaysToAdd = 7;
      for (const quartzDow of cronExpr.dayOfWeek) {
        let targetJsDow = quartzDow === 1 ? 0 : quartzDow - 1;
        let daysToAdd = (targetJsDow - jsDow + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        if (daysToAdd < minDaysToAdd) minDaysToAdd = daysToAdd;
      }
      current.setDate(current.getDate() + minDaysToAdd);
      current.setHours(0, 0, 0, 0);
      continue;
    }
    if (!isValidDayOfMonth(cronExpr, current)) {
      const nextDay = findNextValidDay(cronExpr, current);
      if (!nextDay) {
        if (current.getMonth() === 11) {
          current = new Date(current.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
        } else {
          current = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1,
            0,
            0,
            0,
            0
          );
        }
      } else {
        current = new Date(
          current.getFullYear(),
          current.getMonth(),
          nextDay,
          0,
          0,
          0,
          0
        );
      }
      continue;
    }
    if (!cronExpr.hour.includes(current.getHours())) {
      const nextHour = cronExpr.hour.find((h) => h > current.getHours());
      if (nextHour === undefined) {
        current.setDate(current.getDate() + 1);
        current.setHours(cronExpr.hour[0], 0, 0, 0);
      } else {
        current.setHours(nextHour, 0, 0, 0);
      }
      continue;
    }
    if (!cronExpr.minute.includes(current.getMinutes())) {
      const nextMinute = cronExpr.minute.find((m) => m > current.getMinutes());
      if (nextMinute === undefined) {
        current.setHours(current.getHours() + 1, cronExpr.minute[0], 0, 0);
      } else {
        current.setMinutes(nextMinute, 0, 0);
      }
      continue;
    }
    if (!cronExpr.second.includes(current.getSeconds())) {
      const nextSecond = cronExpr.second.find((s) => s > current.getSeconds());
      if (nextSecond === undefined) {
        current.setMinutes(current.getMinutes() + 1, cronExpr.second[0], 0);
      } else {
        current.setSeconds(nextSecond, 0);
      }
      continue;
    }
    return current;
  }
  throw new Error("未找到下一个匹配的执行时间（可能表达式过于稀疏或无效）");
}

/**
 * 查找下一个有效的日期（天）
 */
function findNextValidDay(cronExpr: CronExpression, date: Date): number | null {
  const year = date.getFullYear();
  const month = date.getMonth();
  const maxDay = getDaysInMonth(year, month);
  for (let d = date.getDate() + 1; d <= maxDay; d++) {
    const testDate = new Date(year, month, d);
    if (isValidDayOfMonth(cronExpr, testDate)) return d;
  }
  return null;
}

/**
 * 获取指定月的天数，考虑闰年
 */
function getDaysInMonth(year: number, month: number): number {
  if (month === 1) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return DAYS_IN_MONTH[month];
}

/**
 * 检查日期是否有效
 */
function isValidDayOfMonth(cronExpr: CronExpression, date: Date): boolean {
  const dayOfMonth = date.getDate();
  const jsDayOfWeek = date.getDay();
  if (cronExpr.dayOfMonth.includes(dayOfMonth)) return true;
  const quartzDayOfWeek = jsDayOfWeek === 0 ? 1 : jsDayOfWeek + 1;
  if (cronExpr.dayOfWeek.includes(quartzDayOfWeek)) return true;
  return false;
}

/**
 * 格式化日期
 */
function formatDate(
  date: Date,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...options,
  })
    .format(date)
    .replace(/\//g, "-")
    .replace(/[\u200E]/g, "");
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return "已过期";
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (days > 0) return `${days} 天后`;
  if (hours > 0) return `${hours} 小时后`;
  if (minutes > 0) return `${minutes} 分钟后`;
  return `${seconds} 秒后`;
}

// 校验函数保留
function validateSingleValue(part: string, field: CronField): ValidationResult {
  if (field.name === "month" && MONTH_NAMES[part.toUpperCase()])
    return { isValid: true };
  if (field.name === "dayOfWeek" && DAY_NAMES[part.toUpperCase()])
    return { isValid: true };
  const num = parseInt(part, 10);
  if (isNaN(num)) return { isValid: false, error: `无效的数字: ${part}` };
  if (num < field.min || num > field.max) {
    return {
      isValid: false,
      error: `${field.name} 字段值必须在 ${field.min}-${field.max} 范围内，当前值: ${num}`,
    };
  }
  return { isValid: true };
}

function validateQuartzExpression(expression: string): ValidationResult {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 6 || parts.length > 7) {
    return { isValid: false, error: "表达式必须包含6-7个字段" };
  }
  const second = parseField(parts[0], 0, 59, "second");
  const minute = parseField(parts[1], 0, 59, "minute");
  const hour = parseField(parts[2], 0, 23, "hour");
  const dayOfMonth = parts[3];
  const month = parseField(parts[4], 1, 12, "month");
  const dayOfWeek = parts[5];
  const year =
    parts.length === 7 ? parseField(parts[6], 1970, 2099, "year") : undefined;
  if (
    dayOfMonth !== "?" &&
    dayOfMonth !== "*" &&
    dayOfWeek !== "?" &&
    dayOfWeek !== "*"
  ) {
    return {
      isValid: false,
      error:
        "dayOfMonth 和 dayOfWeek 字段不能同时指定具体值，其中一个必须为 ? 或 *",
    };
  }
  return { isValid: true };
}

function toTimeZone(date: Date, timeZone: string): Date {
  const invdate = new Date(date.toLocaleString("en-US", { timeZone }));
  invdate.setMilliseconds(date.getMilliseconds());
  return invdate;
}
