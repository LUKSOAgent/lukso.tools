import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: '/app/logs/api-error.log',
      level: 'error',
      format: combine(timestamp(), json()),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: '/app/logs/api-combined.log',
      format: combine(timestamp(), json()),
    })
  );
}
