import { MONTH_NAMES, DAY_NAMES, CRON_FIELDS } from "../constants";
import { ValidationResult, CronField } from "../interface/interfaces";

/**
 * 校验 Quartz Cron 表达式
 * @param {string} expression Cron 表达式
 * @returns {ValidationResult} 校验结果
 */
export function validateQuartzExpression(expression: string): ValidationResult {
  try {
    if (!expression || typeof expression !== "string") {
      return {
        isValid: false,
        error: "表达式不能为空且必须是字符串",
      };
    }

    const trimmedExpression = expression.trim();
    if (trimmedExpression === "") {
      return {
        isValid: false,
        error: "表达式不能为空",
      };
    }

    const parts = trimmedExpression.split(/\s+/);

    // 检查字段数量
    if (parts.length < 6 || parts.length > 7) {
      return {
        isValid: false,
        error: `表达式必须包含6-7个字段，当前包含${parts.length}个字段`,
      };
    }

    // 校验每个字段
    for (let i = 0; i < Math.min(parts.length, CRON_FIELDS.length); i++) {
      const field = CRON_FIELDS[i];
      const part = parts[i];

      const fieldValidation = validateField(part, field, i);
      if (!fieldValidation.isValid) {
        return {
          isValid: false,
          error: `${field.name} 字段错误: ${fieldValidation.error}`,
        };
      }
    }

    // 特殊校验：dayOfMonth 和 dayOfWeek 不能同时指定具体值
    if (parts.length >= 6) {
      const dayOfMonth = parts[3];
      const dayOfWeek = parts[5];
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
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `校验过程中发生错误: ${
        error instanceof Error ? error.message : "未知错误"
      }`,
    };
  }
}

/**
 * 校验单个字段
 * @param {string} part 字段内容
 * @param {CronField} field 字段定义
 * @param {number} fieldIndex 字段索引
 * @returns {ValidationResult}
 */
function validateField(
  part: string,
  field: CronField,
  fieldIndex: number
): ValidationResult {
  if (!part || part === "") {
    return {
      isValid: false,
      error: "字段不能为空",
    };
  }

  // 处理特殊字符
  if (part === "*" || part === "?") {
    return { isValid: true };
  }

  // 处理 L/W/LW 字符（仅用于 dayOfMonth 和 dayOfWeek）
  if (field.name === "dayOfMonth" || field.name === "dayOfWeek") {
    // LW 只能单独出现
    if (part === "LW" && field.name === "dayOfMonth") {
      return { isValid: true };
    }
    // L 只能单独出现或 dayOfWeek 支持 6L 这种写法
    if (part === "L") {
      return { isValid: true };
    }
    if (field.name === "dayOfWeek" && /^\dL$/.test(part)) {
      return { isValid: true };
    }
    // W 只能单独出现或数字+W
    if (field.name === "dayOfMonth" && /^\d{1,2}W$/.test(part)) {
      return { isValid: true };
    }
  }

  // 处理 # 字符（仅用于 dayOfWeek，且只能有一个 #）
  if (field.name === "dayOfWeek" && part.includes("#")) {
    const hashParts = part.split("#");
    if (
      hashParts.length === 2 &&
      /^[1-7]$|^SUN$|^MON$|^TUE$|^WED$|^THU$|^FRI$|^SAT$/i.test(hashParts[0]) &&
      /^[1-5]$/.test(hashParts[1])
    ) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: "# 表达式格式错误，应为: day#n，且 n=1-5",
      };
    }
  }

  // 禁止 L/W/LW 与列表、范围混用（仅对 L/W/LW 特殊用法）
  if (
    (/^L$/.test(part) ||
      /^LW$/.test(part) ||
      /^\dL$/.test(part) ||
      /^\d{1,2}W$/.test(part)) &&
    (part.includes(",") || part.includes("-"))
  ) {
    return { isValid: false, error: "L/W/LW 不能与列表或范围混用" };
  }
  // 禁止 # 与列表、范围混用
  if (part.includes("#") && (part.includes(",") || part.includes("-"))) {
    return { isValid: false, error: "# 不能与列表或范围混用" };
  }

  // 处理范围表达式
  if (part.includes("-")) {
    return validateRangeExpression(part, field);
  }

  // 处理步长表达式
  if (part.includes("/")) {
    return validateStepExpression(part, field);
  }

  // 处理列表表达式
  if (part.includes(",")) {
    return validateListExpression(part, field);
  }

  // 处理单个值
  return validateSingleValue(part, field);
}

/**
 * 校验单个值
 * @param {string} part 字段内容
 * @param {CronField} field 字段定义
 * @returns {ValidationResult}
 */
function validateSingleValue(part: string, field: CronField): ValidationResult {
  // 处理月份名称
  if (field.name === "month" && MONTH_NAMES[part.toUpperCase()]) {
    return { isValid: true };
  }

  // 处理星期名称
  if (field.name === "dayOfWeek" && DAY_NAMES[part.toUpperCase()]) {
    return { isValid: true };
  }

  // 校验数字
  const num = parseInt(part, 10);
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `无效的数字: ${part}`,
    };
  }

  if (num < field.min || num > field.max) {
    return {
      isValid: false,
      error: `${field.name} 字段值必须在 ${field.min}-${field.max} 范围内，当前值: ${num}`,
    };
  }

  return { isValid: true };
}

/**
 * 校验范围表达式
 * @param {string} part 范围表达式
 * @param {CronField} field 字段定义
 * @returns {ValidationResult}
 */
function validateRangeExpression(
  part: string,
  field: CronField
): ValidationResult {
  const parts = part.split("-");
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "范围表达式格式错误，应为: start-end",
    };
  }

  const start = parts[0];
  const end = parts[1];

  // 校验起始值
  const startValidation = validateSingleValue(start, field);
  if (!startValidation.isValid) {
    return startValidation;
  }

  // 校验结束值
  const endValidation = validateSingleValue(end, field);
  if (!endValidation.isValid) {
    return endValidation;
  }

  // 校验范围
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);

  if (startNum >= endNum) {
    return {
      isValid: false,
      error: "范围起始值必须小于结束值",
    };
  }

  return { isValid: true };
}

/**
 * 校验步长表达式
 * @param {string} part 步长表达式
 * @param {CronField} field 字段定义
 * @returns {ValidationResult}
 */
function validateStepExpression(
  part: string,
  field: CronField
): ValidationResult {
  const parts = part.split("/");
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "步长表达式格式错误，应为: range/step",
    };
  }

  const range = parts[0];
  const step = parts[1];

  // 校验步长值
  const stepNum = parseInt(step, 10);
  if (isNaN(stepNum) || stepNum <= 0) {
    return {
      isValid: false,
      error: "步长必须是正整数",
    };
  }

  // 校验范围部分
  if (range === "*" || range === "?") {
    return { isValid: true };
  }

  if (range.includes("-")) {
    return validateRangeExpression(range, field);
  }

  return validateSingleValue(range, field);
}

/**
 * 校验列表表达式
 * @param {string} part 列表表达式
 * @param {CronField} field 字段定义
 * @returns {ValidationResult}
 */
function validateListExpression(
  part: string,
  field: CronField
): ValidationResult {
  const items = part.split(",");
  for (let i = 0, len = items.length; i < len; i++) {
    const trimmedItem = items[i].trim();
    if (field.name === "dayOfWeek" && DAY_NAMES[trimmedItem.toUpperCase()])
      continue;
    if (field.name === "month" && MONTH_NAMES[trimmedItem.toUpperCase()])
      continue;
    const itemValidation = validateSingleValue(trimmedItem, field);
    if (!itemValidation.isValid) return itemValidation;
  }
  return { isValid: true };
}

/**
 * 获取表达式的描述信息
 * @param {string} expression Cron 表达式
 * @returns {string} 描述信息
 */
export function getExpressionDescription(expression: string): string {
  const validation = validateQuartzExpression(expression);
  if (!validation.isValid) {
    return "无效表达式";
  }

  const parts = expression.trim().split(/\s+/);
  const descriptions: string[] = [];

  // 解析各个字段
  if (parts.length >= 1) {
    descriptions.push(parseFieldDescription(parts[0], "秒"));
  }
  if (parts.length >= 2) {
    descriptions.push(parseFieldDescription(parts[1], "分钟"));
  }
  if (parts.length >= 3) {
    descriptions.push(parseFieldDescription(parts[2], "小时"));
  }
  if (parts.length >= 4) {
    descriptions.push(parseFieldDescription(parts[3], "日"));
  }
  if (parts.length >= 5) {
    descriptions.push(parseFieldDescription(parts[4], "月"));
  }
  if (parts.length >= 6) {
    descriptions.push(parseFieldDescription(parts[5], "星期"));
  }
  if (parts.length >= 7) {
    descriptions.push(parseFieldDescription(parts[6], "年"));
  }

  return descriptions.join(" ");
}

/**
 * 解析字段描述
 * @param {string} part 字段内容
 * @param {string} fieldName 字段名称
 * @returns {string} 字段描述
 */
function parseFieldDescription(part: string, fieldName: string): string {
  if (part === "*") {
    return `每${fieldName}`;
  }
  if (part === "?") {
    return `不指定${fieldName}`;
  }
  if (part === "L") {
    if (fieldName === "日") return "本月最后一天";
    if (fieldName === "星期") return "本月最后一个该星期几";
    return `最后${fieldName}`;
  }
  if (part === "LW") {
    return "本月最后一个工作日";
  }
  if (/^\d{1,2}W$/.test(part)) {
    return `最接近${part.replace("W", "")}号的工作日`;
  }
  if (/^\dL$/.test(part)) {
    return `本月最后一个星期${part[0]}`;
  }
  if (/^([1-7]|SUN|MON|TUE|WED|THU|FRI|SAT)#([1-5])$/i.test(part)) {
    const [dow, nth] = part.split("#");
    return `本月第${nth}个${dow}星期`;
  }
  if (part.includes("/")) {
    const [range, step] = part.split("/");
    const stepNum = parseInt(step, 10);
    return `每${stepNum}${fieldName}`;
  }
  if (part.includes("-")) {
    const [start, end] = part.split("-");
    return `从${start}到${end}${fieldName}`;
  }
  if (part.includes(",")) {
    const items = part.split(",");
    return `第${items.join("、")}${fieldName}`;
  }
  // 处理星期名称
  if (fieldName === "星期" && DAY_NAMES[part.toUpperCase()]) {
    return `第${DAY_NAMES[part.toUpperCase()]}${fieldName}`;
  }
  // 处理月份名称
  if (fieldName === "月" && MONTH_NAMES[part.toUpperCase()]) {
    return `第${MONTH_NAMES[part.toUpperCase()]}${fieldName}`;
  }
  return `第${part}${fieldName}`;
}

/**
 * 解析单个值，支持英文缩写
 * @param {string} part 字段内容
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 解析后的数值
 */
function parseValue(part: string, min: number, max: number): number {
  // 处理月份名称
  if (MONTH_NAMES[part.toUpperCase()]) {
    return MONTH_NAMES[part.toUpperCase()];
  }
  // 处理星期名称
  if (DAY_NAMES[part.toUpperCase()]) {
    return DAY_NAMES[part.toUpperCase()];
  }
  const num = parseInt(part, 10);
  if (isNaN(num)) {
    throw new Error(`无效的数字: ${part}`);
  }
  if (num < min || num > max) {
    throw new Error(`值必须在 ${min}-${max} 范围内，当前值: ${num}`);
  }
  return num;
}

/**
 * 生成范围数组（更高效，避免 push）
 * @param {number} start 起始值
 * @param {number} end 结束值
 * @returns {number[]} 范围数组
 */
function generateRange(start: number, end: number): number[] {
  if (start > end) return [];
  const len = end - start + 1;
  const arr = new Array(len);
  for (let i = 0; i < len; i++) arr[i] = start + i;
  return arr;
}

/**
 * 解析字段，支持范围、步长、列表、特殊字符（优化内存和效率）
 * @param {string} part 字段内容
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {(number|string)[]} 解析结果
 */
function parseField(
  part: string,
  min: number,
  max: number
): (number | string)[] {
  if (part === "*" || part === "?") return generateRange(min, max);
  if (part.includes(",")) {
    // 用 Set 去重，避免多余数组
    const set = new Set<number | string>();
    part.split(",").forEach((item) => {
      parseField(item.trim(), min, max).forEach((v) => set.add(v));
    });
    return Array.from(set).sort();
  }
  if (/^LW$/.test(part)) return ["LW"];
  if (/^L$/.test(part)) return ["L"];
  if (/^\d{1,2}W$/.test(part)) return [part];
  if (/^\dL$/.test(part)) return [part];
  if (
    /^[1-7]#([1-5])$/.test(part) ||
    /^(SUN|MON|TUE|WED|THU|FRI|SAT)#([1-5])$/i.test(part)
  )
    return [part];
  if (part.includes("-")) {
    const [start, end] = part.split("-");
    return generateRange(
      parseValue(start, min, max),
      parseValue(end, min, max)
    );
  }
  if (part.includes("/")) {
    const [range, step] = part.split("/");
    const stepNum = parseInt(step, 10);
    if (isNaN(stepNum) || stepNum <= 0) throw new Error("步长必须是正整数");
    const rangeValues = parseField(range, min, max);
    const result: (number | string)[] = [];
    for (let i = 0, len = rangeValues.length; i < len; i += stepNum) {
      result.push(rangeValues[i]);
    }
    return result;
  }
  return [parseValue(part, min, max)];
}
