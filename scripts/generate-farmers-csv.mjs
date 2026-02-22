/**
 * Generates a CSV with all farmer columns (including profile_pic_url).
 * Uses shuffled pools of 10 values for names, villages, etc.
 * Usage: node scripts/generate-farmers-csv.mjs [count]
 * Default count: 3000. Output: farmers-seed.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PROFILE_PIC_URLS = [
  'https://5w3tc3tne6.ucarecd.net/a69812bc-7b3a-4619-a37b-580735bfc987/-/preview/260x280/',
  'https://5w3tc3tne6.ucarecd.net/cf73c3a5-4c37-44bf-bea7-fb4ecadc8234/-/preview/900x500/',
];

const NAMES = [
  'Ramesh Kumar', 'Sunita Patil', 'Vijay Sharma', 'Lakshmi Reddy', 'Suresh Nair',
  'Kavitha Iyer', 'Rajesh Singh', 'Anita Desai', 'Mohan Gupta', 'Priya Menon',
];

const VILLAGES = [
  'Devgaon', 'Vadgaon', 'Shirpur', 'Nashik', 'Jalgaon',
  'Sangamner', 'Rahuri', 'Kopargaon', 'Shirdi', 'Yeola',
];

const TALUKAS = [
  'Parner', 'Shrirampur', 'Nevasa', 'Rahata', 'Sangamner',
  'Akole', 'Kopargaon', 'Niphad', 'Malegaon', 'Yeola',
];

const DISTRICTS = [
  'Ahmadnagar', 'Pune', 'Nashik', 'Jalgaon', 'Dhule',
  'Beed', 'Aurangabad', 'Solapur', 'Satara', 'Kolhapur',
];

const STATES = ['Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra', 'Maharashtra'];

const PINCODES = ['414302', '411014', '422101', '425001', '424001', '431122', '431001', '413001', '415001', '416001'];

const LANDMARKS = [
  'Near Panchayat Office', 'Opposite Primary School', 'Behind Temple', 'Near Bus Stand', 'Main Road',
  'Near Health Center', 'Village Square', 'Near Gramin Bank', 'Post Office Road', 'Near Mandir',
];

const EDUCATION = [
  'Illiterate', 'Primary', '5th Pass', '8th Pass', '10th Pass',
  '12th Pass', 'Graduate', 'Post Graduate', 'ITI', 'Diploma',
];

const FPC = ['FPC001', 'FPC002', 'FPC003', 'FPC004', 'FPC005', 'FPC006', 'FPC007', 'FPC008', 'FPC009', 'FPC010'];

const SHG = ['SHG-A', 'SHG-B', 'SHG-C', 'SHG-D', 'SHG-E', 'SHG-F', 'SHG-G', 'SHG-H', 'SHG-I', 'SHG-J'];

const CASTE = ['General', 'OBC', 'SC', 'ST', 'VJNT', 'General', 'OBC', 'SC', 'ST', 'OBC'];

const SOCIAL_CATEGORY = ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'OBC', 'SC', 'ST', 'General'];

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const KYC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear, endYear) {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  const month = String(m).padStart(2, '0');
  const day = String(d).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

function csvEscape(val) {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function generateRow(index) {
  const farmerCode = `F${String(index).padStart(4, '0')}`;
  return {
    name: pick(NAMES),
    farmer_code: farmerCode,
    gender: pick(GENDERS),
    dob: randomDate(1960, 2000),
    education: pick(EDUCATION),
    kyc_status: pick(KYC_STATUSES),
    profile_pic_url: pick(PROFILE_PIC_URLS),
    village: pick(VILLAGES),
    taluka: pick(TALUKAS),
    district: pick(DISTRICTS),
    state: pick(STATES),
    pincode: pick(PINCODES),
    landmark: pick(LANDMARKS),
    fpc: pick(FPC),
    shg: pick(SHG),
    caste: pick(CASTE),
    social_category: pick(SOCIAL_CATEGORY),
    ration_card: Math.random() > 0.5,
  };
}

function main() {
  const count = parseInt(process.argv[2] || '3000', 10) || 3000;
  const outPath = path.join(ROOT, 'farmers-seed.csv');

  const headers = [
    'name', 'farmer_code', 'gender', 'dob', 'education', 'kyc_status', 'profile_pic_url',
    'village', 'taluka', 'district', 'state', 'pincode', 'landmark',
    'fpc', 'shg', 'caste', 'social_category', 'ration_card',
  ];

  const lines = [headers.join(',')];
  for (let i = 1; i <= count; i++) {
    const row = generateRow(i);
    const values = headers.map((h) => csvEscape(row[h]));
    lines.push(values.join(','));
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Generated ${count} farmers → ${outPath}`);
  console.log('Upload this file via: CSV Upload page (logged in as TENANT) or:');
  console.log(`  curl -X POST http://localhost:${process.env.PORT || 8080}/api/csv/upload \\`);
  console.log(`    -H "Cookie: token=YOUR_JWT" -F "file=@${outPath}"`);
  console.log('  (Start worker if needed: npm run worker)');
}

main();
