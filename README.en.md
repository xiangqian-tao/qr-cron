# Quartz Cron Utility

A pure JavaScript utility for validating and calculating execution times of Quartz cron expressions.

## Features

### 1. Expression Validation
- Real-time validation of Quartz cron expressions
- Detailed error messages
- Full support for Quartz cron syntax
- No external dependencies

### 2. Execution Time Calculation
- Calculate the next N execution times
- Support custom start time and timezone (default: Asia/Shanghai)
- Show relative time (e.g., "in 3 days", "in 2 hours")
- Show the next 5 execution times by default

## Installation

```bash
npm install qz-cron
```

## Usage

### Import Functions

```javascript
// ES6 import
import {
  validateQuartzExpression,
  getNextExecutionTimes,
  getNextExecutionTime,
  getRelativeTime
} from 'qz-cron';

// CommonJS import
const {
  validateQuartzExpression,
  getNextExecutionTimes
} = require('qz-cron');
```

### Expression Validation

```javascript
// Validate an expression
const result = validateQuartzExpression('0 0 12 * * ?');
console.log(result.isValid); // true
console.log(result.error); // undefined

// Validate an invalid expression
const invalidResult = validateQuartzExpression('0 0 12 * *');
console.log(invalidResult.isValid); // false
console.log(invalidResult.error); // "Expression must have 6-7 fields, got 5"
```

### Execution Time Calculation (with Timezone)

```javascript
// Get the next 5 execution times, default timezone is Asia/Shanghai
const times = getNextExecutionTimes('0 0 12 * * ?', 5);
console.log(times[0].formatted); // 2024-05-20 12:00:00

// Get the next 3 execution times in New York timezone
const timesNY = getNextExecutionTimes('0 0 12 * * ?', 3, new Date(), 'America/New_York');
console.log(timesNY[0].formatted); // 2024-05-20 12:00:00 (New York time)

// Get the next execution time in UTC
const nextTimeUTC = getNextExecutionTime('0 0 12 * * ?', new Date(), 'UTC');
console.log(nextTimeUTC.formatted); // 2024-05-20 12:00:00 (UTC)

// Calculate from a custom start time
const startDate = new Date('2024-01-01T10:00:00');
const timesFromStart = getNextExecutionTimes('0 0 12 * * ?', 3, startDate, 'Asia/Shanghai');
```

### Relative Time Calculation

```javascript
const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day later
const relativeTime = getRelativeTime(futureDate);
console.log(relativeTime); // "in 1 day"
```

## API Reference

### validateQuartzExpression(expression: string): ValidationResult

Validate a Quartz cron expression.

**Parameters:**
- `expression` (string): Quartz cron expression

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

### getNextExecutionTimes(expression: string, count?: number, startDate?: Date, timezone?: string): ExecutionTime[]

Get the next N execution times.

**Parameters:**
- `expression` (string): Quartz cron expression
- `count` (number, optional): Number of times, default is 5
- `startDate` (Date, optional): Start time, default is now
- `timezone` (string, optional): Timezone, default is "Asia/Shanghai". Use any IANA timezone string (e.g., "UTC", "Asia/Shanghai", "America/New_York")

**Returns:**
```typescript
interface ExecutionTime {
  index: number;
  time: Date;
  formatted: string; // Formatted string in the specified timezone
}
```

### getNextExecutionTime(expression: string, startDate?: Date, timezone?: string): ExecutionTime

Get the next execution time.

**Parameters:**
- `expression` (string): Quartz cron expression
- `startDate` (Date, optional): Start time, default is now
- `timezone` (string, optional): Timezone, default is "Asia/Shanghai"

### getRelativeTime(date: Date): string

Get a human-readable relative time string.

**Parameters:**
- `date` (Date): Target date

**Returns:** A string like "in 1 day", "in 2 hours", etc.

## Supported Expression Format

### Basic Format
```
second minute hour day month dayOfWeek [year]
```

### Special Characters
- `*`: All values
- `?`: No specific value (only for day and dayOfWeek fields)
- `/`: Step, e.g., `0/15` means every 15 seconds
- `-`: Range, e.g., `1-5` means 1 to 5
- `,`: List, e.g., `1,3,5` means 1, 3, 5
- `L`: Last day (only for day and dayOfWeek fields)
- `W`: Nearest weekday (only for day field)
- `#`: Nth weekday of the month (only for dayOfWeek field)

### Common Expression Examples

| Expression | Description |
|------------|-------------|
| `0 0 12 * * ?` | Every day at 12:00 PM |
| `0 0 9 ? * MON` | Every Monday at 9:00 AM |
| `0 0 2 1 * ?` | 2:00 AM on the 1st of every month |
| `0 */5 * * * ?` | Every 5 minutes |
| `0 30 * * * ?` | At the 30th minute of every hour |
| `0 30 3 * * ?` | Every day at 3:30 AM |
| `0 0 12 * * ? 2024` | Every day at 12:00 PM in 2024 |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Development mode (watch files)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint
```

## Tech Stack

- TypeScript
- Rollup (build tool)
- Jest (test framework)
- ESLint (linter)

## Browser Support

- Node.js >= 14.0.0
- Modern browsers (ES2017+)

## License

MIT 