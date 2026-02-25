import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'tenants', key: 'id' },
    },
    role: {
        type: DataTypes.ENUM('TENANT', 'FIELD_OFFICER', 'FARMER'),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
    },
    mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        { fields: ['mobile'] },
        { fields: ['tenant_id', 'role'] }, // lookup agent by tenant + role
    ],
});
export default User;
//# sourceMappingURL=User.js.map