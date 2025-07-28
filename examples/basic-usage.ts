import { 
  validateQuartzExpression, 
  getNextExecutionTimes, 
  getNextExecutionTime,
  getRelativeTime,
  type ValidationResult,
  type ExecutionTime
} from '../src/index';

// 示例1: 校验表达式
console.log('=== 表达式校验示例 ===');
const expressions: string[] = [
  '0 0 12 * * ?',           // 每天中午12点
  '0 0 9 ? * MON',          // 每周一上午9点
  '0 */5 * * * ?',          // 每5分钟执行一次
  '0 0 12 * *',             // 无效表达式（缺少字段）
  '60 0 12 * * ?'           // 无效表达式（秒数超出范围）
];

expressions.forEach((expr: string) => {
  const result: ValidationResult = validateQuartzExpression(expr);
  console.log(`表达式: ${expr}`);
  console.log(`  有效: ${result.isValid}`);
  if (!result.isValid) {
    console.log(`  错误: ${result.error}`);
  }
  console.log('');
});

// 示例2: 获取执行时间
console.log('=== 执行时间计算示例 ===');
const cronExpression: string = '0 0 12 * * ?'; // 每天中午12点
const times: ExecutionTime[] = getNextExecutionTimes(cronExpression, 3);

console.log(`表达式: ${cronExpression}`);
console.log('未来3次执行时间:');
times.forEach((time: ExecutionTime) => {
  const relative: string = getRelativeTime(time.time);
  console.log(`  ${time.index}. ${time.formatted} (${relative})`);
});
console.log('');

// 示例3: 获取下一次执行时间
console.log('=== 下一次执行时间示例 ===');
const nextTime: ExecutionTime = getNextExecutionTime(cronExpression);
console.log(`表达式: ${cronExpression}`);
console.log(`下一次执行: ${nextTime.formatted}`);
console.log(`相对时间: ${getRelativeTime(nextTime.time)}`);
console.log('');

// 示例4: 从指定时间开始计算
console.log('=== 指定开始时间示例 ===');
const startDate: Date = new Date('2024-01-01T10:00:00');
const timesFromStart: ExecutionTime[] = getNextExecutionTimes(cronExpression, 2, startDate);
console.log(`开始时间: ${startDate.toISOString()}`);
console.log('未来2次执行时间:');
timesFromStart.forEach((time: ExecutionTime) => {
  console.log(`  ${time.index}. ${time.formatted}`);
});

// 示例5: 处理不同类型的表达式
console.log('=== 不同类型表达式示例 ===');
const differentExpressions = [
  { expr: '0 0 12 * * ?', desc: '每天中午12点' },
  { expr: '0 0 9 ? * MON', desc: '每周一上午9点' },
  { expr: '0 */5 * * * ?', desc: '每5分钟执行一次' },
  { expr: '0 30 * * * ?', desc: '每小时的第30分钟' },
  { expr: '0 0 2 1 * ?', desc: '每月1号凌晨2点' }
];

differentExpressions.forEach(({ expr, desc }) => {
  console.log(`\n${desc}: ${expr}`);
  const nextTimes = getNextExecutionTimes(expr, 2);
  nextTimes.forEach(time => {
    console.log(`  ${time.formatted} (${getRelativeTime(time.time)})`);
  });
}); 