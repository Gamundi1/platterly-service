import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  ENABLED_CLIENT_DOMAIN: Joi.string().default('http://localhost:4200'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().default('platterly'),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('password'),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  VAPID_PRIVATE_KEY: Joi.string().required(),
  VAPID_PUBLIC_KEY: Joi.string().required(),
});
