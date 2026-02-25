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
        { fields: ['farmer_id'] },
        { fields: ['district'] }, // analytics GROUP BY district
        { fields: ['state'] }, // analytics GROUP BY state
        { fields: ['district', 'village'] }, // WHERE district = ? AND village = ?
    ],
});
export default FarmerAddress;
//# sourceMappingURL=FarmerAddress.js.map