/**
 * Generates a CSV with all farmer columns (Karnataka / Kannada-style names).
 * Names: First + Surname + 2-digit suffix (e.g. Raghavendra Gowda01).
 * Usage: npx tsx scripts/generate-farmers-csv.ts [count]
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

const PAN_URL = 'https://5w3tc3tne6.ucarecd.net/c7d13f28-665b-48b3-8d46-5e244d7a9bf4/11.webp';
const AADHAAR_URL = 'https://5w3tc3tne6.ucarecd.net/dea27951-0ec3-46ea-8ee2-b45ce6cbb64f/pancard1.jpg';

// Kannada / Karnataka style: First Name + Surname + 2-digit suffix → 25×25×100 = 62,500 unique
const FIRST_NAMES = [
  'Raghavendra', 'Shivappa', 'Basavaraj', 'Manjunath', 'Mallikarjun',
  'Nagaraj', 'Siddappa', 'Hanumanth', 'Prakash', 'Mahesh',
  'Channappa', 'Ravi', 'Ganesh', 'Shankar', 'Kiran',
  'Lakshmi', 'Savita', 'Geetha', 'Annapurna', 'Pavitra',
  'Radha', 'Nandini', 'Bhavya', 'Roopa', 'Sumathi',
];

const LAST_NAMES = [
  'Gowda', 'Patil', 'Shetty', 'Naik', 'Hegde',
  'Reddy', 'Kulkarni', 'Bhat', 'Poojari', 'Desai',
  'Hiremath', 'Kammar', 'Angadi', 'Jadhav', 'Mali',
  'Yaligar', 'Gouda', 'Hallikeri', 'Sutar', 'Dodamani',
  'Hosamani', 'Talawar', 'Nayak', 'Koppad', 'Mudalagi',
];

function generateUniqueName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const suffix = String(index % 100).padStart(2, '0');
  return `${first} ${last}${suffix}`;
}

/** Male first name indices 0–14; female 15–24. Use with index % FIRST_NAMES.length. */
function genderFromFirstIndex(firstIndex: number): 'MALE' | 'FEMALE' {
  return firstIndex < 15 ? 'MALE' : 'FEMALE';
}

const VILLAGES = [
  'Devgaon',
  'Vadgaon',
  'Shirpur',
  'Nashik',
  'Jalgaon',
  'Sangamner',
  'Rahuri',
  'Kopargaon',
  'Shirdi',
  'Yeola',
];

const TALUKAS = [
  'Parner',
  'Shrirampur',
  'Nevasa',
  'Rahata',
  'Sangamner',
  'Akole',
  'Kopargaon',
  'Niphad',
  'Malegaon',
  'Yeola',
];

const DISTRICTS = [
  'Ahmadnagar',
  'Pune',
  'Nashik',
  'Jalgaon',
  'Dhule',
  'Beed',
  'Aurangabad',
  'Solapur',
  'Satara',
  'Kolhapur',
];

const STATES = [
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
  'Maharashtra',
];

const PINCODES = [
  '414302',
  '411014',
  '422101',
  '425001',
  '424001',
  '431122',
  '431001',
  '413001',
  '415001',
  '416001',
];

const LANDMARKS = [
  'Near Panchayat Office',
  'Opposite Primary School',
  'Behind Temple',
  'Near Bus Stand',
  'Main Road',
  'Near Health Center',
  'Village Square',
  'Near Gramin Bank',
  'Post Office Road',
  'Near Mandir',
];

const EDUCATION = [
  'Illiterate',
  'Primary',
  '5th Pass',
  '8th Pass',
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
  'ITI',
  'Diploma',
];

const FPC = [
  'FPC001',
  'FPC002',
  'FPC003',
  'FPC004',
  'FPC005',
  'FPC006',
  'FPC007',
  'FPC008',
  'FPC009',
  'FPC010',
];

const SHG = [
  'SHG-A',
  'SHG-B',
  'SHG-C',
  'SHG-D',
  'SHG-E',
  'SHG-F',
  'SHG-G',
  'SHG-H',
  'SHG-I',
  'SHG-J',
];

const CASTE = [
  'General',
  'OBC',
  'SC',
  'ST',
  'VJNT',
  'General',
  'OBC',
  'SC',
  'ST',
  'OBC',
];

const SOCIAL_CATEGORY = [
  'General',
  'OBC',
  'SC',
  'ST',
  'VJNT',
  'SBC',
  'OBC',
  'SC',
  'ST',
  'General',
];

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
const KYC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear: number, endYear: number): string {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  const month = String(m).padStart(2, '0');
  const day = String(d).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

function csvEscape(val: string | number | boolean): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function generateRow(index: number, farmerCode: string): Record<string, string | boolean> {
  const firstIndex = index % FIRST_NAMES.length;
  return {
    name: generateUniqueName(index),
    farmer_code: farmerCode,
    gender: genderFromFirstIndex(firstIndex),
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
    pan_url: PAN_URL,
    aadhaar_url: AADHAAR_URL,
  };
}

function main() {
  const count = parseInt(process.argv[2] || '3000', 10) || 3000;
  const outPath = path.join(ROOT, 'farmers-seed.csv');

  const headers = [
    'name',
    'farmer_code',
    'gender',
    'dob',
    'education',
    'kyc_status',
    'profile_pic_url',
    'pan_url',
    'aadhaar_url',
    'village',
    'taluka',
    'district',
    'state',
    'pincode',
    'landmark',
    'fpc',
    'shg',
    'caste',
    'social_category',
    'ration_card',
  ];

  // Farmer codes: 5000 and above, unique and random order
  const codeNumbers = shuffle(
    Array.from({ length: count }, (_, i) => 5000 + i)
  );

  const lines: string[] = [headers.join(',')];

  for (let i = 0; i < count; i++) {
    const farmerCode = `F${codeNumbers[i]}`;
    const row = generateRow(i, farmerCode);
    const values = headers.map((h) => csvEscape(row[h]));
    lines.push(values.join(','));
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Generated ${count} farmers → ${outPath}`);
  console.log('Upload this file via: CSV Upload page (logged in as TENANT) or:');
  console.log(`  curl -X POST http://localhost:${process.env.PORT || 8080}/api/csv/upload \\`);
  console.log(`    -H "Cookie: token=YOUR_JWT" -F "file=@${outPath}"`);
}

main();
