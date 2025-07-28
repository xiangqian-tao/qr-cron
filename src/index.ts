// 导出校验相关函数和类型
export {
  validateQuartzExpression,
  getExpressionDescription,
} from "./core/validator";

// 导出调度器相关函数和类型
export {
  getNextExecutionTimes,
  getNextExecutionTime,
  getRelativeTime,
} from "./core/scheduler";

// 导入函数用于默认导出
import {
  validateQuartzExpression,
  getExpressionDescription,
} from "./core/validator";
import {
  getNextExecutionTimes,
  getNextExecutionTime,
  getRelativeTime,
} from "./core/scheduler";

// 默认导出所有功能
export default {
  validateQuartzExpression,
  getExpressionDescription,
  getNextExecutionTimes,
  getNextExecutionTime,
  getRelativeTime,
};

export type { ValidationResult, ExecutionTime } from './interface/interfaces';
