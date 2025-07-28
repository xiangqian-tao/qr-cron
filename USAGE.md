# Quartz Cron 使用指南

## 快速开始

### 安装

```bash
npm install qz-cron
```

### 基本使用

```javascript
import { validateQuartzExpression, getNextExecutionTimes } from 'qz-cron';

// 校验表达式
const result = validateQuartzExpression('0 0 12 * * ?');
console.log(result.isValid); // true

// 获取未来执行时间
const times = getNextExecutionTimes('0 0 12 * * ?', 5);
console.log(times);
```

## 核心功能

### 1. 表达式校验

`validateQuartzExpression(expression: string): ValidationResult`

校验 Quartz Cron 表达式是否正确。

```javascript
import { validateQuartzExpression } from 'qz-cron';

// 有效表达式
const validResult = validateQuartzExpression('0 0 12 * * ?');
console.log(validResult.isValid); // true

// 无效表达式
const invalidResult = validateQuartzExpression('0 0 12 * *');
console.log(invalidResult.isValid); // false
console.log(invalidResult.error); // "表达式必须包含6-7个字段，当前包含5个字段"
```

### 2. 执行时间计算

`getNextExecutionTimes(expression: string, count?: number, startDate?: Date): ExecutionTime[]`

获取未来 N 次执行时间。

```javascript
import { getNextExecutionTimes } from 'qz-cron';

// 获取未来5次执行时间（默认）
const times = getNextExecutionTimes('0 0 12 * * ?');

// 获取未来3次执行时间
const times3 = getNextExecutionTimes('0 0 12 * * ?', 3);

// 从指定时间开始计算
const startDate = new Date('2024-01-01T10:00:00');
const timesFromStart = getNextExecutionTimes('0 0 12 * * ?', 3, startDate);

// 输出结果
times.forEach(time => {
  console.log(`${time.index}. ${time.formatted}`);
  // 1. 2024-01-15 12:00:00
  // 2. 2024-01-16 12:00:00
  // 3. 2024-01-17 12:00:00
  // ...
});
```

### 3. 获取下一次执行时间

`getNextExecutionTime(expression: string, startDate?: Date): ExecutionTime`

获取下一次执行时间。

```javascript
import { getNextExecutionTime } from 'qz-cron';

const nextTime = getNextExecutionTime('0 0 12 * * ?');
console.log(nextTime.formatted); // "2024-01-15 12:00:00"
console.log(nextTime.index); // 1
```

### 4. 相对时间计算

`getRelativeTime(date: Date): string`

获取相对时间描述。

```javascript
import { getRelativeTime } from 'qz-cron';

const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1天后
const relative = getRelativeTime(futureDate);
console.log(relative); // "1 天后"

const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1小时前
const pastRelative = getRelativeTime(pastDate);
console.log(pastRelative); // "已过期"
```

## 表达式格式

### 基本格式

```
秒 分 时 日 月 星期 [年]
```

### 字段说明

| 字段 | 允许值 | 特殊字符 |
|------|--------|----------|
| 秒 | 0-59 | * / - , |
| 分 | 0-59 | * / - , |
| 时 | 0-23 | * / - , |
| 日 | 1-31 | * / - , ? L W |
| 月 | 1-12 或 JAN-DEC | * / - , |
| 星期 | 1-7 或 SUN-SAT | * / - , ? L # |
| 年 | 1970-2099 | * / - , |

### 特殊字符

- `*`: 表示所有值
- `?`: 不指定值（仅用于日和星期字段）
- `/`: 步长，如 `0/15` 表示每15秒
- `-`: 范围，如 `1-5` 表示1到5
- `,`: 列表，如 `1,3,5` 表示1、3、5
- `L`: 最后一天（仅用于日和星期字段）
- `W`: 工作日（仅用于日字段）
- `#`: 第几个星期几（仅用于星期字段）

### 常用表达式示例

| 表达式 | 描述 |
|--------|------|
| `0 0 12 * * ?` | 每天中午12点 |
| `0 0 9 ? * MON` | 每周一上午9点 |
| `0 0 2 1 * ?` | 每月1号凌晨2点 |
| `0 */5 * * * ?` | 每5分钟执行一次 |
| `0 30 * * * ?` | 每小时的第30分钟 |
| `0 30 3 * * ?` | 每天凌晨3点30分 |
| `0 0 12 * * ? 2024` | 2024年每天中午12点 |
| `0 0 12 L * ?` | 每月最后一天中午12点 |
| `0 0 12 ? * MON#1` | 每月第一个周一中午12点 |

## 类型定义

```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ExecutionTime {
  index: number;
  time: Date;
  formatted: string;
}
```

## 错误处理

```javascript
import { validateQuartzExpression, getNextExecutionTimes } from 'qz-cron';

// 校验错误处理
const result = validateQuartzExpression('invalid expression');
if (!result.isValid) {
  console.error('表达式错误:', result.error);
}

// 执行时间计算错误处理
try {
  const times = getNextExecutionTimes('invalid expression', 5);
} catch (error) {
  console.error('计算执行时间失败:', error.message);
}
```

## 实际应用场景

### 1. 表单验证

```javascript
function validateCronInput(expression) {
  const result = validateQuartzExpression(expression);
  if (!result.isValid) {
    // 显示错误信息
    showError(result.error);
    return false;
  }
  return true;
}
```

### 2. 任务调度预览

```javascript
function previewSchedule(expression) {
  try {
    const times = getNextExecutionTimes(expression, 10);
    return times.map(time => ({
      ...time,
      relative: getRelativeTime(time.time)
    }));
  } catch (error) {
    console.error('无法预览调度:', error.message);
    return [];
  }
}
```

### 3. 定时任务管理

```javascript
class TaskScheduler {
  constructor() {
    this.tasks = new Map();
  }

  addTask(id, cronExpression, callback) {
    // 校验表达式
    const validation = validateQuartzExpression(cronExpression);
    if (!validation.isValid) {
      throw new Error(`无效的 cron 表达式: ${validation.error}`);
    }

    // 获取下次执行时间
    const nextTime = getNextExecutionTime(cronExpression);
    
    this.tasks.set(id, {
      expression: cronExpression,
      callback,
      nextExecution: nextTime.time
    });
  }

  getNextExecutions(id, count = 5) {
    const task = this.tasks.get(id);
    if (!task) return [];

    return getNextExecutionTimes(task.expression, count);
  }
}
```

## 性能考虑

- 表达式校验是同步操作，性能很好
- 执行时间计算对于复杂表达式可能需要更多时间
- 建议缓存计算结果以提高性能

## 浏览器兼容性

- Node.js >= 14.0.0
- 现代浏览器（支持 ES2017）
- 不支持 IE 浏览器 