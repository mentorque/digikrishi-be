import { Farmer, FarmerAddress, FarmerProfileDetails, FarmerLand, FarmerAgentMap, User, } from '../models/index.js';
import * as elasticsearchService from './elasticsearch.service.js';
export async function getPaginated(tenantId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Farmer.findAndCountAll({
        where: { tenant_id: tenantId },
        limit,
        offset,
        include: [
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails' },
            { model: FarmerLand, as: 'FarmerLands' },
            {
                model: FarmerAgentMap,
                as: 'FarmerAgentMaps',
                include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
            },
        ],
        order: [['created_at', 'DESC']],
    });
    return { farmers: rows, total: count };
}
export async function getById(id, tenantId) {
    const farmer = await Farmer.findOne({
        where: { id, tenant_id: tenantId },
        include: [
            { model: User, as: 'User', attributes: ['id', 'email', 'mobile', 'role'] },
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails' },
            { model: FarmerLand, as: 'FarmerLands' },
            {
                model: FarmerAgentMap,
                as: 'FarmerAgentMaps',
                include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
            },
        ],
    });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    return farmer;
}
export async function create(data, tenantId, agentId) {
    const { address, profileDetails, lands, ...farmerData } = data;
    const existingCode = await Farmer.findOne({
        where: { farmer_code: farmerData.farmer_code, tenant_id: tenantId },
    });
    if (existingCode) {
        const err = new Error('Farmer code already exists');
        err.status = 400;
        throw err;
    }
    const user = await User.findOne({
        where: { tenant_id: tenantId, role: 'FARMER' },
    });
    const userId = user?.id ?? null;
    const farmer = await Farmer.create({
        ...farmerData,
        tenant_id: tenantId,
        user_id: userId,
        created_by_agent_id: agentId ?? null,
    });
    if (address) {
        await FarmerAddress.create({ ...address, farmer_id: farmer.id });
    }
    if (profileDetails) {
        await FarmerProfileDetails.create({ ...profileDetails, farmer_id: farmer.id });
    }
    if (lands?.length) {
        await FarmerLand.bulkCreate(lands.map((l) => ({ ...l, farmer_id: farmer.id })));
    }
    if (agentId) {
        await FarmerAgentMap.create({ farmer_id: farmer.id, agent_id: agentId });
    }
    const full = await Farmer.findByPk(farmer.id, {
        include: [
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails' },
            { model: User, as: 'User' },
        ],
    });
    if (full) {
        await elasticsearchService.indexFarmer(full, full.FarmerAddress, full.FarmerProfileDetails);
    }
    return full;
}
export async function update(id, tenantId, data) {
    const farmer = await Farmer.findOne({
        where: { id, tenant_id: tenantId },
        include: [
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails' },
            { model: User, as: 'User' },
        ],
    });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    const { address, profileDetails, lands, ...farmerData } = data;
    await farmer.update(farmerData);
    if (address) {
        if (farmer.FarmerAddress) {
            await farmer.FarmerAddress.update(address);
        }
        else {
            await FarmerAddress.create({ ...address, farmer_id: farmer.id });
        }
    }
    if (profileDetails) {
        if (farmer.FarmerProfileDetails) {
            await farmer.FarmerProfileDetails.update(profileDetails);
        }
        else {
            await FarmerProfileDetails.create({ ...profileDetails, farmer_id: farmer.id });
        }
    }
    if (lands !== undefined) {
        await FarmerLand.destroy({ where: { farmer_id: farmer.id } });
        if (lands.length) {
            await FarmerLand.bulkCreate(lands.map((l) => ({ ...l, farmer_id: farmer.id })));
        }
    }
    const updated = await Farmer.findByPk(farmer.id, {
        include: [
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails' },
            { model: User, as: 'User' },
        ],
    });
    if (updated) {
        await elasticsearchService.indexFarmer(updated, updated.FarmerAddress, updated.FarmerProfileDetails);
    }
    return updated;
}
export async function softDelete(id, tenantId) {
    const farmer = await Farmer.findOne({ where: { id, tenant_id: tenantId } });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    await farmer.update({ is_activated: false });
    return farmer;
}
//# sourceMappingURL=farmer.service.js.map