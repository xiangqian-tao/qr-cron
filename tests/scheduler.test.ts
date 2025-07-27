import { getNextExecutionTimes, getNextExecutionTime, getRelativeTime } from '../src/core/scheduler';

describe('Quartz Scheduler', () => {
  describe('getNextExecutionTimes', () => {
    test('应该获取未来执行时间', () => {
      const expression = '0 0 12 * * ?'; // 每天中午12点
      const times = getNextExecutionTimes(expression, 3);
      
      expect(times).toHaveLength(3);
      expect(times[0].index).toBe(1);
      expect(times[1].index).toBe(2);
      expect(times[2].index).toBe(3);
      
      // 检查时间格式
      times.forEach(time => {
        expect(time.formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        expect(time.time).toBeInstanceOf(Date);
      });
    });

    test('应该处理每5分钟执行一次', () => {
      const expression = '0 */5 * * * ?';
      const times = getNextExecutionTimes(expression, 2);
      
      expect(times).toHaveLength(2);
      
      // 检查时间间隔是否为5分钟
      const diff = times[1].time.getTime() - times[0].time.getTime();
      expect(diff).toBe(5 * 60 * 1000); // 5分钟
    });

    test('应该处理每周一执行', () => {
      const expression = '0 0 9 ? * MON';
      const times = getNextExecutionTimes(expression, 2);
      
      expect(times).toHaveLength(2);
      
      // 检查是否为周一 (JavaScript中 0=Sunday, 1=Monday, ..., 6=Saturday)
      // MON在Quartz中表示2，对应JavaScript的1
      times.forEach(time => {
        expect(time.time.getDay()).toBe(1); // 1 = Monday
      });
    });

    test('应该处理指定开始时间', () => {
      const expression = '0 0 12 * * ?';
      const startDate = new Date('2024-01-01T10:00:00');
      const times = getNextExecutionTimes(expression, 1, startDate);
      
      expect(times).toHaveLength(1);
      expect(times[0].time.getTime()).toBeGreaterThan(startDate.getTime());
    });

    test('应该抛出错误处理无效表达式', () => {
      expect(() => {
        getNextExecutionTimes('invalid expression', 1);
      }).toThrow();
    });
  });

  describe('getNextExecutionTime', () => {
    test('应该获取下一次执行时间', () => {
      const expression = '0 0 12 * * ?';
      const nextTime = getNextExecutionTime(expression);
      
      expect(nextTime.index).toBe(1);
      expect(nextTime.time).toBeInstanceOf(Date);
      expect(nextTime.formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getRelativeTime', () => {
    test('应该计算相对时间', () => {
      const now = new Date();
      
      // 测试1小时后
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      expect(getRelativeTime(oneHourLater)).toBe('1 小时后');
      
      // 测试1天后
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(getRelativeTime(oneDayLater)).toBe('1 天后');
      
      // 测试1分钟后
      const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
      expect(getRelativeTime(oneMinuteLater)).toBe('1 分钟后');
      
      // 测试已过期
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(getRelativeTime(oneHourAgo)).toBe('已过期');
    });
  });
}); 