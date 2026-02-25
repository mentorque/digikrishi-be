import { Op } from 'sequelize';
import { Farmer, FarmerAddress, FarmerProfileDetails, FarmerLand, FarmerAgentMap, FarmerDoc, User, UploadLog, } from '../models/index.js';
import * as elasticsearchService from './elasticsearch.service.js';
const DOC_URL_KEYS = [
    'shg_byelaws_url',
    'extract_7_12_url',
    'consent_letter_url',
    'aadhaar_url',
    'pan_url',
    'bank_doc_url',
    'other_doc_url',
];
function hasAnyDocUrl(docs) {
    if (!docs || typeof docs !== 'object')
        return false;
    return DOC_URL_KEYS.some((k) => {
        const v = docs[k];
        return v != null && String(v).trim() !== '';
    });
}
function docPayload(farmerId, docs) {
    const out = { farmer_id: farmerId };
    for (const k of DOC_URL_KEYS) {
        const v = docs[k];
        const s = v != null ? String(v).trim() : '';
        out[k] = s || null;
    }
    return out;
}
/** List: only fields used by list table (code, name, village/district, kyc, status). */
export async function getPaginated(tenantId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Farmer.findAndCountAll({
        where: { tenant_id: tenantId },
        limit,
        offset,
        attributes: ['id', 'farmer_code', 'name', 'kyc_status', 'is_activated', 'created_at'],
        include: [
            { model: FarmerAddress, as: 'FarmerAddress', attributes: ['village', 'district'] },
        ],
        order: [['created_at', 'DESC']],
    });
    return { farmers: rows, total: count };
}
/** Detail: only fields used by detail form (no FarmerDoc – use GET /:id/documents for docs). */
export async function getById(id, tenantId) {
    const farmer = await Farmer.findOne({
        where: { id, tenant_id: tenantId },
        include: [
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
        ],
    });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    return farmer;
}
/** Fetch only documents for a farmer (for Documents tab). */
export async function getDocumentsById(id, tenantId) {
    const farmer = await Farmer.findOne({
        where: { id, tenant_id: tenantId },
        attributes: ['id'],
        include: [{ model: FarmerDoc, as: 'FarmerDoc', required: false }],
    });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    return farmer.FarmerDoc || null;
}
/** Fetch by ids for search results: id, code, name, village (for assign modal). */
export async function getByIds(ids, tenantId) {
    if (!ids.length)
        return [];
    const rows = await Farmer.findAll({
        where: { id: { [Op.in]: ids }, tenant_id: tenantId },
        attributes: ['id', 'farmer_code', 'name'],
        include: [
            { model: FarmerAddress, as: 'FarmerAddress', attributes: ['village'] },
        ],
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter((f) => f != null);
}
export async function create(data, tenantId, agentId) {
    const { address, profileDetails, lands, docs, ...farmerData } = data;
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
    if (docs && hasAnyDocUrl(docs)) {
        await FarmerDoc.create(docPayload(farmer.id, docs));
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
    return full;
}
export async function update(id, tenantId, data) {
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
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    const { address, profileDetails, lands, docs, ...farmerData } = data;
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
        if (farmer.FarmerProfileDetail) {
            await farmer.FarmerProfileDetail.update(profileDetails);
        }
        else {
            await FarmerProfileDetails.create({ ...profileDetails, farmer_id: farmer.id });
        }
    }
    if (docs !== undefined) {
        const docRow = await FarmerDoc.findOne({ where: { farmer_id: farmer.id } });
        const payload = docPayload(farmer.id, docs);
        if (docRow) {
            await docRow.update(payload);
        }
        else if (hasAnyDocUrl(docs)) {
            await FarmerDoc.create(payload);
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
            { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
            { model: FarmerDoc, as: 'FarmerDoc' },
            { model: User, as: 'User' },
        ],
    });
    if (updated) {
        await elasticsearchService.indexFarmer(updated, updated.FarmerAddress, updated.FarmerProfileDetail);
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
export async function assignAgent(farmerId, tenantId, agentId) {
    const farmer = await Farmer.findOne({
        where: { id: farmerId, tenant_id: tenantId },
        include: [
            { model: FarmerAgentMap, as: 'FarmerAgentMaps' },
            { model: FarmerAddress, as: 'FarmerAddress' },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
        ],
    });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    if (agentId) {
        const agent = await User.findOne({
            where: { id: agentId, tenant_id: tenantId, role: 'FIELD_OFFICER' },
        });
        if (!agent) {
            const err = new Error('Field officer not found');
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
    return updated;
}
/** Allowed doc_type values for upload (maps to FarmerDoc column). */
export const DOC_TYPE_TO_COLUMN = {
    pan: 'pan_url',
    aadhaar: 'aadhaar_url',
    shg_byelaws: 'shg_byelaws_url',
    extract_7_12: 'extract_7_12_url',
    consent_letter: 'consent_letter_url',
    bank_doc: 'bank_doc_url',
    other: 'other_doc_url',
};
/** Set profile picture S3 key (upload only if not already set, unless overwrite). */
export async function setProfilePicKey(farmerId, tenantId, s3Key, options = {}) {
    const farmer = await Farmer.findOne({ where: { id: farmerId, tenant_id: tenantId } });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    if (!options.overwrite && farmer.profile_pic_url) {
        const err = new Error('Profile picture already set');
        err.status = 400;
        throw err;
    }
    await farmer.update({ profile_pic_url: s3Key });
    await UploadLog.create({
        farmer_id: farmerId,
        uploaded_by: options.uploadedBy ?? null,
        doc_type: 'profile',
        s3_key: s3Key,
        status: 'success',
    });
    return farmer;
}
/** Set a specific document S3 key (append/update in FarmerDoc). */
export async function setDocKey(farmerId, tenantId, docType, s3Key, options = {}) {
    const col = DOC_TYPE_TO_COLUMN[docType];
    if (!col) {
        const err = new Error(`Invalid doc_type: ${docType}`);
        err.status = 400;
        throw err;
    }
    const farmer = await Farmer.findOne({ where: { id: farmerId, tenant_id: tenantId } });
    if (!farmer) {
        const err = new Error('Farmer not found');
        err.status = 404;
        throw err;
    }
    let docRow = await FarmerDoc.findOne({ where: { farmer_id: farmerId } });
    const updatePayload = { [col]: s3Key };
    if (!docRow) {
        docRow = await FarmerDoc.create({ farmer_id: farmerId, ...updatePayload });
    }
    else {
        await docRow.update(updatePayload);
    }
    await UploadLog.create({
        farmer_id: farmerId,
        uploaded_by: options.uploadedBy ?? null,
        doc_type: docType,
        s3_key: s3Key,
        status: 'success',
    });
    return docRow;
}
//# sourceMappingURL=farmer.service.js.map