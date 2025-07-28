const { 
  validateQuartzExpression, 
  getNextExecutionTimes, 
  getNextExecutionTime,
  getRelativeTime 
} = require('../dist/index.js');

// 示例1: 校验表达式
console.log('=== 表达式校验示例 ===');
const expressions = [
  '0 0 12 * * ?',           // 每天中午12点
  '0 0 9 ? * MON',          // 每周一上午9点
  '0 */5 * * * ?',          // 每5分钟执行一次
  '0 0 12 * *',             // 无效表达式（缺少字段）
  '60 0 12 * * ?'           // 无效表达式（秒数超出范围）
];

expressions.forEach(expr => {
  const result = validateQuartzExpression(expr);
  console.log(`表达式: ${expr}`);
  console.log(`  有效: ${result.isValid}`);
  if (!result.isValid) {
    console.log(`  错误: ${result.error}`);
  }
  console.log('');
});

// 示例2: 获取执行时间
console.log('=== 执行时间计算示例 ===');
const cronExpression = '0 0 12 * * ?'; // 每天中午12点
const times = getNextExecutionTimes(cronExpression, 3);

console.log(`表达式: ${cronExpression}`);
console.log('未来3次执行时间:');
times.forEach(time => {
  const relative = getRelativeTime(time.time);
  console.log(`  ${time.index}. ${time.formatted} (${relative})`);
});
console.log('');

// 示例3: 获取下一次执行时间
console.log('=== 下一次执行时间示例 ===');
const nextTime = getNextExecutionTime(cronExpression);
console.log(`表达式: ${cronExpression}`);
console.log(`下一次执行: ${nextTime.formatted}`);
console.log(`相对时间: ${getRelativeTime(nextTime.time)}`);
console.log('');

// 示例4: 从指定时间开始计算
console.log('=== 指定开始时间示例 ===');
const startDate = new Date('2024-01-01T10:00:00');
const timesFromStart = getNextExecutionTimes(cronExpression, 2, startDate);
console.log(`开始时间: ${startDate.toISOString()}`);
console.log('未来2次执行时间:');
timesFromStart.forEach(time => {
  console.log(`  ${time.index}. ${time.formatted}`);
}); 