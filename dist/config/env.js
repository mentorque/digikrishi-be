import dotenv from 'dotenv';
dotenv.config();
export const env = {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_HOST: process.env.DB_HOST ?? '',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME ?? '',
    DB_USER: process.env.DB_USER ?? '',
    DB_PASSWORD: process.env.DB_PASSWORD ?? '',
    JWT_SECRET: process.env.JWT_SECRET ?? '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    DUCKDB_PATH: process.env.DUCKDB_PATH || ':memory:',
    CSV_UPLOAD_PATH: process.env.CSV_UPLOAD_PATH || './uploads/csv',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
//# sourceMappingURL=env.js.map