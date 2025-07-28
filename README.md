# Quartz Cron 工具

一个纯 JavaScript 的 Quartz 定时任务表达式校验和执行时间计算工具库。

## 功能特性

### 1. 表达式校验
- 实时校验 Quartz Cron 表达式格式
- 提供详细的错误信息
- 支持完整的 Quartz 表达式语法
- 不依赖任何外部库

### 2. 执行时间计算
- 计算未来 N 次执行时间
- 支持自定义开始时间和时区（默认上海）
- 显示相对时间（如：3天后、2小时后等）
- 默认显示未来 5 次执行时间

## 安装

```bash
npm install qz-cron
```

## 使用方法

### 导入工具函数

```javascript
// ES6 模块导入
import { 
  validateQuartzExpression, 
  getNextExecutionTimes,
  getNextExecutionTime,
  getRelativeTime 
} from 'qz-cron';

// CommonJS 导入
const { 
  validateQuartzExpression, 
  getNextExecutionTimes 
} = require('qz-cron');
```

### 表达式校验

```javascript
// 校验表达式
const result = validateQuartzExpression('0 0 12 * * ?');
console.log(result.isValid); // true
console.log(result.error); // undefined

// 校验无效表达式
const invalidResult = validateQuartzExpression('0 0 12 * *');
console.log(invalidResult.isValid); // false
console.log(invalidResult.error); // "表达式必须包含6-7个字段，当前包含5个字段"
```

### 执行时间计算（支持时区）

```javascript
// 获取未来5次执行时间，默认时区为上海
const times = getNextExecutionTimes('0 0 12 * * ?', 5);
console.log(times[0].formatted); // 2024-05-20 12:00:00

// 获取未来3次执行时间，指定时区为纽约
const timesNY = getNextExecutionTimes('0 0 12 * * ?', 3, new Date(), 'America/New_York');
console.log(timesNY[0].formatted); // 2024-05-20 12:00:00（纽约时间）

// 获取下一次执行时间，指定时区为UTC
const nextTimeUTC = getNextExecutionTime('0 0 12 * * ?', new Date(), 'UTC');
console.log(nextTimeUTC.formatted); // 2024-05-20 12:00:00（UTC时间）

// 从指定时间开始计算
const startDate = new Date('2024-01-01T10:00:00');
const timesFromStart = getNextExecutionTimes('0 0 12 * * ?', 3, startDate, 'Asia/Shanghai');
```

### 相对时间计算

```javascript
const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1天后
const relativeTime = getRelativeTime(futureDate);
console.log(relativeTime); // "1 天后"
```

## API 文档

### validateQuartzExpression(expression: string): ValidationResult

校验 Quartz 表达式是否正确。

**参数:**
- `expression` (string): Quartz cron 表达式

**返回值:**
```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

### getNextExecutionTimes(expression: string, count?: number, startDate?: Date, timezone?: string): ExecutionTime[]

获取未来 N 次执行时间。

**参数:**
- `expression` (string): Quartz cron 表达式
- `count` (number, 可选): 执行次数，默认 5 次
- `startDate` (Date, 可选): 开始时间，默认为当前时间
- `timezone` (string, 可选): 时区，默认为 "Asia/Shanghai"，可用 IANA 时区字符串（如 "UTC"、"Asia/Shanghai"、"America/New_York"）

**返回值:**
```typescript
interface ExecutionTime {
  index: number;
  time: Date;
  formatted: string; // 按指定时区格式化后的字符串
}
```

### getNextExecutionTime(expression: string, startDate?: Date, timezone?: string): ExecutionTime

获取下一次执行时间。

**参数:**
- `expression` (string): Quartz cron 表达式
- `startDate` (Date, 可选): 开始时间，默认为当前时间
- `timezone` (string, 可选): 时区，默认为 "Asia/Shanghai"

### getRelativeTime(date: Date): string

获取相对时间描述。

**参数:**
- `date` (Date): 目标日期

**返回值:** 相对时间字符串，如 "1 天后"、"2 小时后" 等

## 支持的表达式格式

### 基本格式
```
秒 分 时 日 月 星期 [年]
```

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

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建库
npm run build

# 开发模式（监听文件变化）
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 技术栈

- TypeScript
- Rollup (构建工具)
- Jest (测试框架)
- ESLint (代码检查)

## 浏览器支持

- Node.js >= 14.0.0
- 现代浏览器（支持 ES2017）

## 许可证

MIT 