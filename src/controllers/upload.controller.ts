import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as presignService from '../services/presign.service.js';
import * as farmerService from '../services/farmer.service.js';

/** Presign URL for farmer profile image. Upload only if farmer has no profile pic (unless overwrite=true). */
export async function profilePresign(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 upload not configured' });
  }
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  const overwrite = req.query.overwrite === 'true';

  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['id', 'profile_pic_url'],
  });
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  if (!overwrite && (farmer as any).profile_pic_url) {
    return res.status(400).json({ message: 'Profile picture already set' });
  }

  const contentType = (req.query.contentType as string) || 'image/jpeg';
  const { uploadUrl, key } = await presignService.generateUploadUrl({
    folder: 'farmers/profiles',
    contentType,
    fileName: 'profile.jpg',
  });
  return res.json({ uploadUrl, key });
}

/** Register profile upload: body { key }. Updates farmer and creates UploadLog. */
export async function profileRegister(req: Request, res: Response) {
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  const userId = (req as any).user.id;
  const key = (req.body?.key as string)?.trim();
  if (!key) {
    return res.status(400).json({ message: 'key is required' });
  }
  const overwrite = req.body?.overwrite === true;
  const farmer = await farmerService.setProfilePicKey(farmerId, tenantId, key, {
    overwrite,
    uploadedBy: userId,
  });
  return res.json({ message: 'Profile picture updated', profile_pic_url: farmer.profile_pic_url });
}

/** Upload profile image via server (one call: file → S3 → register). Avoids browser CORS with S3. */
export async function profileUpload(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 upload not configured' });
  }
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    return res.status(400).json({ message: 'No file uploaded; use multipart field "file"' });
  }
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  const userId = (req as any).user.id;
  const overwrite = req.query.overwrite === 'true';

  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['id', 'profile_pic_url'],
  });
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  if (!overwrite && (farmer as any).profile_pic_url) {
    return res.status(400).json({ message: 'Profile picture already set; use ?overwrite=true to replace' });
  }

  const key = presignService.generateUploadKey({
    folder: 'farmers/profiles',
    fileName: file.originalname || 'profile.jpg',
  });
  await presignService.uploadBuffer({
    key,
    body: file.buffer,
    contentType: file.mimetype || 'image/jpeg',
  });
  const updated = await farmerService.setProfilePicKey(farmerId, tenantId, key, {
    overwrite,
    uploadedBy: userId,
  });
  return res.json({
    message: overwrite ? 'Profile picture updated' : 'Profile picture added',
    profile_pic_url: updated.profile_pic_url,
  });
}

/** Presign URL for a specific document type. */
export async function documentPresign(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 upload not configured' });
  }
  const farmerId = String(req.params.id ?? '');
  const docType = (req.query.docType as string)?.trim();
  const tenantId = (req as any).user.tenant_id;

  if (!docType || !farmerService.DOC_TYPE_TO_COLUMN[docType]) {
    return res.status(400).json({
      message: 'docType is required',
      allowed: Object.keys(farmerService.DOC_TYPE_TO_COLUMN),
    });
  }

  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['id'],
  });
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }

  const contentType = (req.query.contentType as string) || 'application/pdf';
  const { uploadUrl, key } = await presignService.generateUploadUrl({
    folder: 'farmers/documents',
    contentType,
    fileName: `${docType}.pdf`,
  });
  return res.json({ uploadUrl, key });
}

/** Register document upload: body { key, docType }. Updates FarmerDoc and creates UploadLog. */
export async function documentRegister(req: Request, res: Response) {
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  const userId = (req as any).user.id;
  const key = (req.body?.key as string)?.trim();
  const docType = (req.body?.docType as string)?.trim();
  if (!key || !docType) {
    return res.status(400).json({ message: 'key and docType are required' });
  }
  await farmerService.setDocKey(farmerId, tenantId, docType, key, { uploadedBy: userId });
  return res.json({ message: 'Document updated', docType, key });
}

/** Upload document via server (one call: file → S3 → register). Avoids browser CORS with S3. */
export async function documentUpload(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 upload not configured' });
  }
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    return res.status(400).json({ message: 'No file uploaded; use multipart field "file"' });
  }
  const farmerId = String(req.params.id ?? '');
  const docType = (req.query.docType as string)?.trim();
  const tenantId = (req as any).user.tenant_id;
  const userId = (req as any).user.id;

  if (!docType || !farmerService.DOC_TYPE_TO_COLUMN[docType]) {
    return res.status(400).json({
      message: 'docType is required',
      allowed: Object.keys(farmerService.DOC_TYPE_TO_COLUMN),
    });
  }

  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['id'],
  });
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }

  const ext = file.originalname?.includes('.') ? file.originalname.replace(/^.*\./, '') : 'pdf';
  const key = presignService.generateUploadKey({
    folder: 'farmers/documents',
    fileName: `${docType}.${ext}`,
  });
  await presignService.uploadBuffer({
    key,
    body: file.buffer,
    contentType: file.mimetype || 'application/pdf',
  });
  await farmerService.setDocKey(farmerId, tenantId, docType, key, { uploadedBy: userId });
  return res.json({
    message: 'Document updated',
    docType,
    key,
  });
}

/** Get signed download URL for profile picture. */
export async function profileDownloadUrl(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 not configured' });
  }
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['profile_pic_url'],
  });
  if (!farmer || !(farmer as any).profile_pic_url) {
    return res.status(404).json({ message: 'No profile picture' });
  }
  const key = (farmer as any).profile_pic_url.trim();
  // Reject if DB has a full URL (e.g. presigned upload URL) — we only accept S3 object keys
  if (key.includes('x-id=') || key.includes('PutObject') || key.includes('http') || key.includes('?')) {
    return res.status(400).json({
      message: 'Profile picture key is invalid (looks like a URL). Please delete and re-upload the profile picture.',
    });
  }
  const { url } = await presignService.generateDownloadUrl(key);
  return res.json({ url });
}

/** Get signed download URL for a document type. */
export async function documentDownloadUrl(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 not configured' });
  }
  const farmerId = String(req.params.id ?? '');
  const docType = (req.query.docType as string)?.trim();
  const tenantId = (req as any).user.tenant_id;
  if (!docType || !farmerService.DOC_TYPE_TO_COLUMN[docType]) {
    return res.status(400).json({ message: 'Invalid docType', allowed: Object.keys(farmerService.DOC_TYPE_TO_COLUMN) });
  }
  const farmer = await (await import('../models/index.js')).Farmer.findOne({
    where: { id: farmerId, tenant_id: tenantId },
    attributes: ['id'],
  });
  if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
  const docRow = await (await import('../models/index.js')).FarmerDoc.findOne({
    where: { farmer_id: farmerId },
  });
  const col = farmerService.DOC_TYPE_TO_COLUMN[docType];
  const key = docRow && (docRow as any)[col] ? String((docRow as any)[col]).trim() : null;
  if (!key) return res.status(404).json({ message: 'Document not found' });
  const { url } = await presignService.generateDownloadUrl(key);
  return res.json({ url });
}

/** Delete profile picture. */
export async function profileDelete(req: Request, res: Response) {
  const farmerId = String(req.params.id ?? '');
  const tenantId = (req as any).user.tenant_id;
  await farmerService.clearProfilePic(farmerId, tenantId);
  return res.json({ message: 'Profile picture removed' });
}

/** Delete a document (clear the doc type URL). */
export async function documentDelete(req: Request, res: Response) {
  const farmerId = String(req.params.id ?? '');
  const docType = String(req.params.docType ?? '').trim();
  const tenantId = (req as any).user.tenant_id;
  if (!farmerService.DOC_TYPE_TO_COLUMN[docType]) {
    return res.status(400).json({ message: 'Invalid docType', allowed: Object.keys(farmerService.DOC_TYPE_TO_COLUMN) });
  }
  await farmerService.clearDocKey(farmerId, tenantId, docType);
  return res.json({ message: 'Document removed', docType });
}
