import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const FarmerDoc = sequelize.define(
  'FarmerDoc',
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
      onDelete: 'CASCADE',
    },
    pan_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'CDN URL for PAN document',
    },
    aadhaar_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'CDN URL for Aadhaar document',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'farmer_docs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['farmer_id'] }],
  }
);

export default FarmerDoc;
