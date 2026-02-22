import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
const FarmerAddress = sequelize.define('FarmerAddress', {
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
    village: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    taluka: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    landmark: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'farmer_addresses',
    timestamps: false,
    indexes: [
        { fields: ['farmer_id'] }, // join on Farmer
        { fields: ['district'] },
        { fields: ['state'] },
        { fields: ['pincode'] },
    ],
});
export default FarmerAddress;
//# sourceMappingURL=FarmerAddress.js.map