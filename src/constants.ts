import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

export const SERVER_NAME = packageJson.name;
export const APP_VERSION = packageJson.version;
export const USER_AGENT = `${packageJson.name}/${packageJson.version}`;

export const BASE_URLS = {
  MAIN: 'https://services.mywhoosh.com/http-service/v1',
  PUBLIC: 'https://services.mywhoosh.com',
  COACHING: 'https://coaching.mywhoosh.com/api/v2',
  SERVICE14: 'https://service14.mywhoosh.com/v1',
  SERVICE20: 'https://service20.mywhoosh.com',
  SERVICE26: 'https://service26.mywhoosh.com/http-service/v1',
  DATA_RECOVERY: 'https://data-recovery.mywhoosh.com',
} as const;
