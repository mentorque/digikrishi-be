import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const UploadLog = sequelize.define(
  'UploadLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    farmer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'farmers', key: 'id' },
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    doc_type: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'profile | pan | aadhaar | shg_byelaws | extract_7_12 | consent_letter | bank_doc | other',
    },
    s3_key: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(32),
      defaultValue: 'success',
      allowNull: false,
      comment: 'success | failed',
    },
  },
  {
    tableName: 'upload_logs',
    timestamps: false,
    indexes: [
      { fields: ['farmer_id'] },
      { fields: ['uploaded_at'] },
    ],
  }
);

export default UploadLog;
