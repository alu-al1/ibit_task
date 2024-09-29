import winston from "winston";

const { transports, FileTransportOptions } = winston;
const { format } = winston;

const getLogFormat = (prefix = "") =>
  format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${prefix}] [${level.toUpperCase()}]: ${message}`;
  });

export function newLogger(prefix) {
  return winston.createLogger({
    //level
    format: format.combine(format.timestamp(), getLogFormat(prefix)),
    transports: [new transports.Console()],
  });
}
export function newFileLogger(prefix, dir = "") {
  const opts = new FileTransportOptions({
    filename: `${prefix}-%DATE%.log`,
    dirname: dir || ".",
    datePattern: "YYYY-MM-DD",
    zippedArchive: false,
    maxSize: "10m",
    maxFiles: "2d",
  });

  return winston.createLogger({
    format: getLogFormat(prefix),
    transports: [transports.File(opts)],
  });
}

class DummyLogger {
  constructor() {}
  error(){};
  warn(){};
  help(){};
  data(){};
  info(){};
  debug(){};
  prompt(){};
  http(){};
  verbose(){};
  input(){};
  silly(){};
}

export const dummyLogger = new DummyLogger();
