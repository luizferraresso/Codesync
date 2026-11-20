'use strict';
require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().min(1).default('hospedja'),
  DB_SSL_CA_PATH: z.string().optional().default(''),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE: z.string().optional().default(''),
  DEEPSEEK_API_KEY: z.string().min(1),
DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
DEEPSEEK_MODEL: z.string().min(1).default('deepseek-chat'),
DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  DEEPSEEK_API_KEY: z.string().optional().default(''),
  DEEPSEEK_BASE_URL: z.string()
    .url()
    .default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string()
    .min(1)
    .default('deepseek-flash'),
  DEEPSEEK_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(120000)
    .default(30000)
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const names = parsed.error.issues.map(issue => issue.path.join('.')).join(', ');
  throw new Error(`Variaveis de ambiente invalidas: ${names}. Consulte .env.example.`);
}
module.exports = parsed.data;
