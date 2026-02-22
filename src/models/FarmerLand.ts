import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const FarmerLand = sequelize.define(
  'FarmerLand',
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
    land_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    crop_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    irrigation_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'farmer_lands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ fields: ['farmer_id'] }], // include + destroy by farmer
  }
);

export default FarmerLand;
