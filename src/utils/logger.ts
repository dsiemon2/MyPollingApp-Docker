// Simple logger for payment services
const logger = {
  info: (data: Record<string, unknown>, message?: string) => {
    console.log(`[INFO]`, message || '', data);
  },
  error: (data: Record<string, unknown>, message?: string) => {
    console.error(`[ERROR]`, message || '', data);
  },
  warn: (data: Record<string, unknown>, message?: string) => {
    console.warn(`[WARN]`, message || '', data);
  },
  debug: (data: Record<string, unknown>, message?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG]`, message || '', data);
    }
  }
};

export default logger;
