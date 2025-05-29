import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const config = {
    port: process.env.PORT || 3000,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'user_monitoring',
    },
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;