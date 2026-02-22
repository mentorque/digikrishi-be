import 'sequelize';

declare module 'sequelize' {
  interface Model<TModelAttributes = any, TCreationAttributes = any> {
    [key: string]: any;
  }
}

export {};
