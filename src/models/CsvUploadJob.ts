import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CsvUploadJob = sequelize.define(
  'CsvUploadJob',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    s3_key: {
      type: DataTypes.STRING(512),
      allowNull: true,
      comment: 'S3 object key; used by worker to stream CSV',
    },
    total_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    success_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failed_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('PROCESSING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PROCESSING',
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'csv_upload_jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ fields: ['tenant_id'] }], // getJobStatus, list by tenant
  }
);

export default CsvUploadJob;
