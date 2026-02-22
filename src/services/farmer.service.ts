import { Op } from 'sequelize';
import {
  Farmer,
  FarmerAddress,
  FarmerProfileDetails,
  FarmerLand,
  FarmerAgentMap,
  FarmerDoc,
  User,
} from '../models/index.js';
import * as elasticsearchService from './elasticsearch.service.js';

export async function getPaginated(tenantId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { rows, count } = await Farmer.findAndCountAll({
    where: { tenant_id: tenantId },
    limit,
    offset,
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
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

export async function getById(id: string, tenantId: string) {
  const farmer = await Farmer.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      { model: User, as: 'User', attributes: ['id', 'email', 'mobile', 'role'] },
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
      { model: FarmerLand, as: 'FarmerLands' },
      {
        model: FarmerAgentMap,
        as: 'FarmerAgentMaps',
        include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
      },
    ],
  });
  if (!farmer) {
    const err = new Error('Farmer not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return farmer;
}

/** Fetch multiple farmers by ids (same includes as list), preserving order of ids. */
export async function getByIds(ids: string[], tenantId: string) {
  if (!ids.length) return [];
  const rows = await Farmer.findAll({
    where: { id: { [Op.in]: ids }, tenant_id: tenantId },
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
      { model: FarmerLand, as: 'FarmerLands' },
      {
        model: FarmerAgentMap,
        as: 'FarmerAgentMaps',
        include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
      },
    ],
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((f): f is NonNullable<typeof f> => f != null);
}

export async function create(data: any, tenantId: string, agentId: string | null) {
  const { address, profileDetails, lands, docs, ...farmerData } = data;
  const existingCode = await Farmer.findOne({
    where: { farmer_code: farmerData.farmer_code, tenant_id: tenantId },
  });
  if (existingCode) {
    const err = new Error('Farmer code already exists') as Error & { status?: number };
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
    await FarmerLand.bulkCreate(lands.map((l: any) => ({ ...l, farmer_id: farmer.id })));
  }
  if (agentId) {
    await FarmerAgentMap.create({ farmer_id: farmer.id, agent_id: agentId });
  }
  if (docs && (docs.pan_url != null || docs.aadhaar_url != null)) {
    await FarmerDoc.create({
      farmer_id: farmer.id,
      pan_url: docs.pan_url?.trim() || null,
      aadhaar_url: docs.aadhaar_url?.trim() || null,
    });
  }
  const full = await Farmer.findByPk(farmer.id, {
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
      { model: User, as: 'User' },
    ],
  });
  if (full) {
    await elasticsearchService.indexFarmer(full, full.FarmerAddress, full.FarmerProfileDetail);
  }
  return full!;
}

export async function update(id: string, tenantId: string, data: any) {
  const farmer = await Farmer.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
      { model: User, as: 'User' },
    ],
  });
  if (!farmer) {
    const err = new Error('Farmer not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const { address, profileDetails, lands, docs, ...farmerData } = data;
  await farmer.update(farmerData);
  if (address) {
    if (farmer.FarmerAddress) {
      await farmer.FarmerAddress.update(address);
    } else {
      await FarmerAddress.create({ ...address, farmer_id: farmer.id });
    }
  }
  if (profileDetails) {
    if (farmer.FarmerProfileDetail) {
      await farmer.FarmerProfileDetail.update(profileDetails);
    } else {
      await FarmerProfileDetails.create({ ...profileDetails, farmer_id: farmer.id });
    }
  }
  if (docs !== undefined) {
    const docRow = await FarmerDoc.findOne({ where: { farmer_id: farmer.id } });
    const panUrl = docs.pan_url?.trim() || null;
    const aadhaarUrl = docs.aadhaar_url?.trim() || null;
    if (docRow) {
      await docRow.update({ pan_url: panUrl, aadhaar_url: aadhaarUrl });
    } else if (panUrl || aadhaarUrl) {
      await FarmerDoc.create({ farmer_id: farmer.id, pan_url: panUrl, aadhaar_url: aadhaarUrl });
    }
  }
  if (lands !== undefined) {
    await FarmerLand.destroy({ where: { farmer_id: farmer.id } });
    if (lands.length) {
      await FarmerLand.bulkCreate(lands.map((l: any) => ({ ...l, farmer_id: farmer.id })));
    }
  }
  const updated = await Farmer.findByPk(farmer.id, {
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      { model: FarmerDoc, as: 'FarmerDoc' },
      { model: User, as: 'User' },
    ],
  });
  if (updated) {
    await elasticsearchService.indexFarmer(updated, updated.FarmerAddress, updated.FarmerProfileDetail);
  }
  return updated!;
}

export async function softDelete(id: string, tenantId: string) {
  const farmer = await Farmer.findOne({ where: { id, tenant_id: tenantId } });
  if (!farmer) {
    const err = new Error('Farmer not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  await farmer.update({ is_activated: false });
  return farmer;
}

export async function assignAgent(
  farmerId: string,
  tenantId: string,
  agentId: string | null
) {
  const farmer = await Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    include: [
      { model: FarmerAgentMap, as: 'FarmerAgentMaps' },
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
    ],
  });
  if (!farmer) {
    const err = new Error('Farmer not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (agentId) {
    const agent = await User.findOne({
      where: { id: agentId, tenant_id: tenantId, role: 'FIELD_OFFICER' },
    });
    if (!agent) {
      const err = new Error('Field officer not found') as Error & { status?: number };
      err.status = 400;
      throw err;
    }
  }
  await FarmerAgentMap.destroy({ where: { farmer_id: farmerId } });
  await farmer.update({ created_by_agent_id: agentId });
  if (agentId) {
    await FarmerAgentMap.create({ farmer_id: farmerId, agent_id: agentId });
  }
  const updated = await Farmer.findByPk(farmerId, {
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      {
        model: FarmerAgentMap,
        as: 'FarmerAgentMaps',
        include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
      },
    ],
  });
  return updated!;
}
