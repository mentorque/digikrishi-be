import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
const FarmerProfileDetails = sequelize.define('FarmerProfileDetails', {
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
    fpc: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shg: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    caste: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    social_category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ration_card: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
    },
}, {
    tableName: 'farmer_profile_details',
    timestamps: false,
});
export default FarmerProfileDetails;
//# sourceMappingURL=FarmerProfileDetails.js.map