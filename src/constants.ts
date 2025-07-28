import { CronField } from "./interface/interfaces";
/**
 * 月份英文缩写与数字的映射
 * 例如：JAN -> 1, FEB -> 2, ..., DEC -> 12
 */
export const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

/**
 * 星期英文缩写与数字的映射（Quartz: 1=Sunday, 2=Monday, ..., 7=Saturday）
 * 例如：SUN -> 1, MON -> 2, ..., SAT -> 7
 */
export const DAY_NAMES: Record<string, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

// 月份天数（非闰年）
export const DAYS_IN_MONTH: number[] = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

/**
 * Quartz Cron 字段定义（参考官方文档）
 * 秒：0-59，支持 , - * /
 * 分钟：0-59，支持 , - * /
 * 小时：0-23，支持 , - * /
 * 日：1-31，支持 , - * ? / L W LW
 * 月：1-12 或 JAN-DEC，支持 , - * /
 * 星期：1-7 或 SUN-SAT，支持 , - * ? / L #
 * 年（可选）：1970-2199，支持 , - * /
 */
export const CRON_FIELDS: CronField[] = [
  {
    name: "second",
    min: 0,
    max: 59,
    allowedChars: ["0-9", "*", "/", "-", ","],
  },
  {
    name: "minute",
    min: 0,
    max: 59,
    allowedChars: ["0-9", "*", "/", "-", ","],
  },
  { name: "hour", min: 0, max: 23, allowedChars: ["0-9", "*", "/", "-", ","] },
  {
    name: "dayOfMonth",
    min: 1,
    max: 31,
    allowedChars: ["0-9", "*", "/", "-", ",", "?", "L", "W", "LW"],
  },
  {
    name: "month",
    min: 1,
    max: 12,
    allowedChars: [
      "0-9",
      "*",
      "/",
      "-",
      ",",
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ],
  },
  {
    name: "dayOfWeek",
    min: 1,
    max: 7,
    allowedChars: [
      "0-9",
      "*",
      "/",
      "-",
      ",",
      "?",
      "L",
      "#",
      "SUN",
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
    ],
  },
  {
    name: "year",
    min: 1970,
    max: 2199,
    allowedChars: ["0-9", "*", "/", "-", ","],
  },
];
