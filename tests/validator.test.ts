import {
  validateQuartzExpression,
  getExpressionDescription,
} from "../src/core/validator";

describe("Quartz Validator", () => {
  describe("validateQuartzExpression", () => {
    test("应该校验有效的表达式", () => {
      const validExpressions = [
        "0 0 12 * * ?",
        "0 0 9 ? * MON",
        "0 0 2 1 * ?",
        "0 */5 * * * ?",
        "0 30 * * * ?",
        "0 30 3 * * ?",
        "0 0 12 * * ? 2024",
      ];

      validExpressions.forEach((expression) => {
        const result = validateQuartzExpression(expression);
        expect(result.isValid).toBe(true);
      });
    });

    test("应该校验无效的表达式", () => {
      const invalidExpressions = [
        { expr: "", error: "表达式不能为空" },
        { expr: "0 0 12 * *", error: "表达式必须包含6-7个字段" },
        { expr: "0 0 12 * * ? * *", error: "表达式必须包含6-7个字段" },
        { expr: "60 0 12 * * ?", error: "second 字段错误" },
        { expr: "0 60 12 * * ?", error: "minute 字段错误" },
        { expr: "0 0 24 * * ?", error: "hour 字段错误" },
        { expr: "0 0 12 32 * ?", error: "dayOfMonth 字段错误" },
        { expr: "0 0 12 * 13 ?", error: "month 字段错误" },
        { expr: "0 0 12 * * 8", error: "dayOfWeek 字段错误" },
      ];

      invalidExpressions.forEach(({ expr, error }) => {
        const result = validateQuartzExpression(expr);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(error);
      });
    });

    test("应该校验特殊字符", () => {
      const specialExpressions = [
        "0 0 12 * * ?",
        "0 0 12 ? * MON",
        "0 0 12 L * ?",
        "0 0 12 15W * ?",
        "0 0 12 * * MON#1",
      ];

      specialExpressions.forEach((expression) => {
        const result = validateQuartzExpression(expression);
        expect(result.isValid).toBe(true);
      });
    });

    test("应该校验范围表达式", () => {
      const rangeExpressions = [
        "0 0 12 1-15 * ?",
        "0 0 9-17 * * ?",
        "0 0-30 12 * * ?",
      ];

      rangeExpressions.forEach((expression) => {
        const result = validateQuartzExpression(expression);
        expect(result.isValid).toBe(true);
      });
    });

    test("应该校验步长表达式", () => {
      const stepExpressions = [
        "0 */5 * * * ?",
        "0 0 */2 * * ?",
        "0 0 12 */3 * ?",
      ];

      stepExpressions.forEach((expression) => {
        const result = validateQuartzExpression(expression);
        expect(result.isValid).toBe(true);
      });
    });

    test("应该校验列表表达式", () => {
      const listExpressions = [
        "0 0 12 1,15 * ?",
        "0 0 9,17 * * ?",
        "0 0 12 ? * MON,WED,FRI",
        "0 0 12 * * MON,WED,FRI",
      ];

      listExpressions.forEach((expression) => {
        const result = validateQuartzExpression(expression);
        if (!result.isValid) {
          console.error(`表达式: ${expression}, 错误: ${result.error}`);
        }
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("getExpressionDescription", () => {
    test("应该生成表达式描述", () => {
      const expressions = [
        {
          expr: "0 0 12 * * ?",
          expected: "第0秒 第0分钟 第12小时 每日 每月 不指定星期",
        },
        {
          expr: "0 */5 * * * ?",
          expected: "第0秒 每5分钟 每小时 每日 每月 不指定星期",
        },
        {
          expr: "0 0 9 ? * MON",
          expected: "第0秒 第0分钟 第9小时 不指定日 每月 第2星期",
        },
      ];

      expressions.forEach(({ expr, expected }) => {
        const description = getExpressionDescription(expr);
        expect(description).toBe(expected);
      });
    });

    test("应该处理无效表达式", () => {
      const description = getExpressionDescription("invalid expression");
      expect(description).toBe("无效表达式");
    });
  });
});

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    return "已过期";
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天后`;
  } else if (hours > 0) {
    return `${hours} 小时后`;
  } else if (minutes > 0) {
    return `${minutes} 分钟后`;
  } else {
    return `${seconds} 秒后`;
  }
}
