import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Who made the request (null if unauthenticated)',
    },
    path: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['path'] },
    ],
  }
);

export default AuditLog;
