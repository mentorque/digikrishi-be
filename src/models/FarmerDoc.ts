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
    shg_byelaws_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'SHG BYE-LAWS Agreement document URL',
    },
    extract_7_12_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: '7/12 Extract document URL',
    },
    consent_letter_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'Consent Letter document URL',
    },
    aadhaar_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'Aadhaar document URL',
    },
    pan_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'PAN document URL',
    },
    bank_doc_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'Bank document URL',
    },
    other_doc_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'Other documents URL',
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
    indexes: [{ fields: ['farmer_id'] }], // join only; URL columns not used in WHERE – avoid over-indexing
  }
);

export default FarmerDoc;
