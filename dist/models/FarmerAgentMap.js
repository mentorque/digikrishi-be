import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
const FarmerAgentMap = sequelize.define('FarmerAgentMap', {
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
    agent_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'farmer_agent_map',
    timestamps: false,
});
export default FarmerAgentMap;
//# sourceMappingURL=FarmerAgentMap.js.map