import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const OtpLog = sequelize.define(
  'OtpLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'otp_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default OtpLog;
