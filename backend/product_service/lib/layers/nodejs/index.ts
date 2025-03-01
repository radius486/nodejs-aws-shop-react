const SERVICE = 'PRODUCT_SERVICE';

export const logger = {
  info: (message: string) => {
    console.log(`${SERVICE}:`, message);
  },
  error: (message: string) => {
    console.error(`${SERVICE}:`, message);
  },
  warn: (message: string) => {
    console.warn(`${SERVICE}:`, message);
  },
  debug: (message: string) => {
    console.debug(`${SERVICE}:`, message);
  },
}
