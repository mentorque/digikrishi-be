import { Sequelize } from 'sequelize';
import { env } from './env.js';

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    connectionTimeoutMillis: 10000,
  },
  define: {
    underscored: false,
    timestamps: true,
  },
});

export { sequelize };
