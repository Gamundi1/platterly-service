export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || 5432,
  dbName: process.env.DB_NAME || 'platterly',
  dbUsername: process.env.DB_USERNAME || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'password',
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
});
