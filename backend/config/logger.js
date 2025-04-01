const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'newcashbank-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Em produção, adicionar transporte para arquivo
    ...(process.env.NODE_ENV === 'production' 
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' })
        ] 
      : [])
  ]
});

// Para usar com Express
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Para compatibilidade com código que usa console
const consoleLogger = {
  info: (...args) => {
    logger.info(args.join(' '));
    console.info(...args);
  },
  error: (...args) => {
    logger.error(args.join(' '));
    console.error(...args);
  },
  warn: (...args) => {
    logger.warn(args.join(' '));
    console.warn(...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(args.join(' '));
      console.debug(...args);
    }
  }
};

module.exports = {
  logger,
  consoleLogger
};
