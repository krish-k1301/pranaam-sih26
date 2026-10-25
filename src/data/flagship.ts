// The flagship application, written by hand so every product rule shows up at least once.
import type { Application, CheckKind, CheckOutcome, CheckResult, Finding } from '../lib/types'
import {
  accreditation,
  buildingCompletion,
  dteNoc,
  facultyList,
  fireNoc,
  infraPhoto,
  makeFaculty,
  terReceipt,
  universityConsent,
  type FacultyMember,
  type InstCtx,
} from './docs'
import { durationFor, type AppBundle } from './bundle'
import { rngFor } from './seed'

export const SHARED_FACULTY: FacultyMember = {
  id: '1-FAC-88123004',
  name: 'Dr. Shrikant Bhosale',
  designation: 'Assistant Professor',
  qual: 'Ph.D.',
  joined: '12.07.2021',
}

export const DECCAN_APP_ID = 'A-2027-000877'
export const DECCAN_NAME = 'Deccan College of Engineering, Satara'
export const DECCAN_PID = '1-4410098120'

export const KONKAN_PHOTO = {
  caption: 'Computer laboratory',
  institution: 'Konkan Institute of Engineering, Ratnagiri',
  year: '2026-27',
  mirrored: true,
  hueShift: 14,
  rows: 3,
}

const ID = 'A-2027-000123'

const app: Application = {
  id: ID,
  institution: 'Sahyadri Institute of Technology',
  city: 'Pune',
  state: 'Maharashtra',
  region: 'Western',
  permanentId: '1-4410023317',
  category: 'Extension of approval',
  academicYear: '2027-28',
  submittedAt: '2027-01-18T10:22:00+05:30',
  assignedOfficer: 'K. Sharma',
  intake: 540,
  faculty: 36,
}

const ctx: InstCtx = {
  appId: ID,
  institution: `${app.institution}, ${app.city}`,
  city: app.city,
  state: app.state,
  address: 'Survey No. 42/1, Ambegaon Budruk, Pune 411046',
  permanentId: app.permanentId,
  intake: app.intake,
  faculty: app.faculty,
}

const faculty = makeFaculty('sahyadri', 36, 88122800)
faculty[20] = SHARED_FACULTY // page 3 of the list

const D = {
  fire: fireNoc(ctx, 1, {
    authority: 'Maharashtra Fire Services',
    authorityLine: 'Office of the Chief Fire Officer, Pune Region',
    nocNo: 'MFS/PUN/2025/04471',
    issued: '02.04.2025',
    validUntil: '31.03.2027',
    uploadedAt: '2027-01-16T15:41:00+05:30',
    area: '18,640 sq m',
    floors: 'Ground + 3',
  }),
  bcc: buildingCompletion(ctx, 2, {
    authority: 'Pune Municipal Corporation',
    authorityLine: 'Building Permission Department',
    certNo: 'PMC/BP/CC/2019/3381',
    issued: '14.08.2019',
    uploadedAt: '2027-01-16T15:44:00+05:30',
    area: '18,640 sq m',
    floors: 'Ground + 3',
    addedFloors: true,
  }),
  nba: accreditation(ctx, 3, {
    certNo: 'NBA/ACCR/2024/11862',
    printedValid: '30.06.2029',
    qrValid: '2027-06-30',
    programmes: ['B.Tech. Computer Engineering', 'B.Tech. Mechanical Engineering', 'B.Tech. Electronics and Telecommunication'],
    uploadedAt: '2027-01-16T15:47:00+05:30',
  }),
  faculty: facultyList(ctx, 4, faculty, '2027-01-17T11:05:00+05:30'),
  consent: universityConsent(ctx, 5, {
    university: 'Savitribai Phule Pune University',
    universityLine: 'Board of College and University Development, Pune',
    refNo: 'SPPU/BCUD/AFF/2027/2290',
    year: '2027-28',
    intakeConsented: 540,
    uploadedAt: '2027-01-17T11:09:00+05:30',
  }),
  ter: terReceipt(ctx, 6, { txn: 'BKS27011604418', amount: '₹1,90,000.00', paidOn: '16.01.2027', uploadedAt: '2027-01-17T11:12:00+05:30' }),
  dte: dteNoc(ctx, 7, {
    directorate: 'Directorate of Technical Education, Maharashtra',
    directorateLine: '3 Mahapalika Marg, Mumbai',
    refNo: 'DTE/MH/NOC/2027/1644',
    issued: '09.01.2027',
    uploadedAt: '2027-01-17T11:15:00+05:30',
  }),
  lab1: infraPhoto(ctx, 8, { caption: 'CSE Lab 1', institution: ctx.institution, year: '2027-28', rows: 3 }, '2027-01-17T11:20:00+05:30'),
  lab2: infraPhoto(ctx, 9, { caption: 'Mechanical workshop', institution: ctx.institution, year: '2027-28', rows: 2, hueShift: -8 }, '2027-01-17T11:22:00+05:30'),
}

const documents = Object.values(D)

const T = '2027-01-18T10:24:'
const F = (n: number) => `${ID}-F${n}`

const findings: Finding[] = [
  {
    id: F(1),
    appId: ID,
    documentId: D.fire.id,
    title: 'Fire NOC expires before the academic year starts',
    reason: 'The NOC is valid until 31 Mar 2027, which is 123 days before the 2027-28 academic year starts on 1 Aug 2027.',
    category: 'Expired',
    severity: 'major',
    confidence: 0.99,
    checkId: 'R-NOC-001',
    checkVersion: 2,
    aphClause: 'APH 2024-27, clause 2.4.3(f)',
    statusEffect: 'expired',
    viewer: 'document',
    page: 1,
    fieldKeys: ['valid_until'],
    createdAt: `${T}06+05:30`,
    evidence: [
      { kind: 'region', documentId: D.fire.id, page: 1, fieldKey: 'valid_until', observed: '31.03.2027' },
      {
        kind: 'structural',
        fact: 'Validity compared with the academic calendar',
        values: [
          ['Valid until', '31 Mar 2027'],
          ['Academic year starts', '1 Aug 2027'],
          ['Gap', '123 days'],
        ],
      },
    ],
  },
  {
    id: F(2),
    appId: ID,
    documentId: D.fire.id,
    title: 'Fire department verification service did not respond',
    reason: 'The NOC number could not be confirmed because the Maharashtra Fire Services service timed out on three attempts.',
    category: 'Verification',
    severity: 'minor',
    confidence: 1,
    checkId: 'SRC-MFS-NOC',
    checkVersion: 1,
    statusEffect: 'source_unavailable',
    viewer: 'document',
    page: 1,
    fieldKeys: ['noc_number'],
    createdAt: `${T}41+05:30`,
    evidence: [
      { kind: 'region', documentId: D.fire.id, page: 1, fieldKey: 'noc_number', observed: 'MFS/PUN/2025/04471' },
      {
        kind: 'issuer',
        sourceName: 'Maharashtra Fire Services, NOC verification',
        requestRef: 'VRQ-2027-0118-00091',
        summary: 'No response within 30 s. Retried 3 times at 2-minute intervals.',
        at: '2027-01-18T10:30:41+05:30',
        responseHash: '',
        outcome: 'Timed out',
      },
    ],
  },
  {
    id: F(3),
    appId: ID,
    documentId: D.bcc.id,
    title: 'Content added to the PDF after it was digitally signed',
    reason: 'The signature covers the first 184,320 bytes; a later revision adds 7,168 bytes, including a fourth-floor row on page 2 that page 1 does not mention.',
    category: 'Anomaly',
    severity: 'major',
    confidence: 0.97,
    checkId: 'AUTH-PDF-INCREMENTAL',
    checkVersion: 1,
    statusEffect: 'manual_review',
    viewer: 'revision',
    page: 2,
    fieldKeys: ['added_floor'],
    createdAt: `${T}12+05:30`,
    revision: { signedBytes: 184320, addedBytes: 7168 },
    evidence: [
      { kind: 'region', documentId: D.bcc.id, page: 2, fieldKey: 'added_floor', observed: 'Fourth · Seminar hall, classrooms · 3,520' },
      { kind: 'region', documentId: D.bcc.id, page: 1, fieldKey: 'floors', observed: 'Ground + 3' },
      {
        kind: 'structural',
        fact: 'PDF revision structure',
        values: [
          ['Signed revision', 'bytes 0–184,320'],
          ['Later revision', '+7,168 bytes'],
          ['Covered by signature', 'No'],
          ['Objects changed', 'Page 2 content stream'],
        ],
      },
      {
        kind: 'issuer',
        sourceName: 'Pune Municipal Corporation, building permission register',
        requestRef: 'VRQ-2027-0118-00093',
        summary: 'Certificate PMC/BP/CC/2019/3381 found, issued 14.08.2019 to the same trust.',
        at: '2027-01-18T10:25:02+05:30',
        responseHash: '4be0c9d1a7f35e8820d6b14c9f0e72a1c5d83b6e09f4a2d7718c3e5b90a6d24f',
        outcome: 'Confirmed',
      },
    ],
  },
  {
    id: F(4),
    appId: ID,
    documentId: D.nba.id,
    title: 'Printed validity differs from the QR code',
    reason: 'The certificate prints “valid till 30.06.2029”, but its QR code payload gives a validity of 30 Jun 2027.',
    category: 'Inconsistent',
    severity: 'major',
    confidence: 0.98,
    checkId: 'AUTH-QR-MATCH',
    checkVersion: 1,
    statusEffect: 'mismatch',
    viewer: 'document',
    page: 1,
    fieldKeys: ['valid_until_printed', 'qr_payload'],
    createdAt: `${T}17+05:30`,
    evidence: [
      { kind: 'region', documentId: D.nba.id, page: 1, fieldKey: 'valid_until_printed', observed: '30.06.2029' },
      { kind: 'region', documentId: D.nba.id, page: 1, fieldKey: 'qr_payload', observed: 'valid_to=2027-06-30' },
      {
        kind: 'structural',
        fact: 'Printed text compared with the decoded QR payload',
        values: [
          ['Printed', '30 Jun 2029'],
          ['QR payload', '30 Jun 2027'],
          ['Difference', '2 years'],
        ],
      },
    ],
  },
  {
    id: F(5),
    appId: ID,
    documentId: D.faculty.id,
    title: 'Faculty member also listed by another institution',
    reason: 'Faculty ID 1-FAC-88123004 appears on page 3 and is also listed full-time by Deccan College of Engineering, Satara, which the AICTE roster shows as the registered employer.',
    category: 'Anomaly',
    severity: 'critical',
    confidence: 0.99,
    checkId: 'XAPP-FACULTY',
    checkVersion: 1,
    aphClause: 'APH 2024-27, clause 5.1(d)',
    statusEffect: 'manual_review',
    viewer: 'cross',
    page: 3,
    fieldKeys: [`row_${SHARED_FACULTY.id}`],
    createdAt: `${T}29+05:30`,
    evidence: [
      { kind: 'region', documentId: D.faculty.id, page: 3, fieldKey: `row_${SHARED_FACULTY.id}`, observed: `${SHARED_FACULTY.id} · ${SHARED_FACULTY.name}` },
      {
        kind: 'cross',
        otherAppId: DECCAN_APP_ID,
        otherInstitution: DECCAN_NAME,
        otherDocumentId: `${DECCAN_APP_ID}-D4`,
        matched: 'Faculty ID and name',
        similarity: 1,
      },
      {
        kind: 'record',
        source: 'AICTE faculty roster',
        recordId: SHARED_FACULTY.id,
        statement: `Registered full-time at ${DECCAN_NAME} (${DECCAN_PID}) since 12 Jul 2021.`,
        asOf: '30 Nov 2026',
      },
    ],
  },
  {
    id: F(6),
    appId: ID,
    documentId: D.dte.id,
    title: 'State directorate service returned an error',
    reason: 'The DTE Maharashtra verification service answered HTTP 503, so the NOC reference could not be confirmed.',
    category: 'Verification',
    severity: 'minor',
    confidence: 1,
    checkId: 'SRC-DTE-MH',
    checkVersion: 1,
    statusEffect: 'source_unavailable',
    viewer: 'document',
    page: 1,
    fieldKeys: ['ref_number'],
    createdAt: `${T}44+05:30`,
    evidence: [
      { kind: 'region', documentId: D.dte.id, page: 1, fieldKey: 'ref_number', observed: 'DTE/MH/NOC/2027/1644' },
      {
        kind: 'issuer',
        sourceName: 'Directorate of Technical Education, Maharashtra',
        requestRef: 'VRQ-2027-0118-00097',
        summary: 'HTTP 503 Service Unavailable. Next automatic retry at 18:00.',
        at: '2027-01-18T10:24:44+05:30',
        responseHash: '9d2f61b07ac4e3518f6e0b2d47c9a85e13f0d6b2c78e4a9150b3d6f2e8c1a704',
        outcome: 'Error',
      },
    ],
  },
  {
    id: F(7),
    appId: ID,
    documentId: D.lab1.id,
    title: 'Lab photo nearly identical to another institution’s',
    reason: 'The “CSE Lab 1” photo matches a photo submitted by Konkan Institute of Engineering, Ratnagiri for 2026-27 at 0.96 perceptual similarity, mirrored horizontally.',
    category: 'Anomaly',
    severity: 'major',
    confidence: 0.93,
    checkId: 'XAPP-PHOTO',
    checkVersion: 1,
    statusEffect: 'manual_review',
    viewer: 'photo',
    page: 1,
    fieldKeys: [],
    createdAt: `${T}33+05:30`,
    evidence: [
      {
        kind: 'cross',
        otherAppId: 'A-2026-004418',
        otherInstitution: KONKAN_PHOTO.institution,
        otherPhoto: KONKAN_PHOTO,
        matched: 'Perceptual hash',
        similarity: 0.96,
      },
      {
        kind: 'structural',
        fact: 'Image fingerprints',
        values: [
          ['This photo', 'c3a1 9e4f 0b72 d815'],
          ['2026-27 photo', 'c3a1 9e4d 0b72 9815'],
          ['Bits that differ', '3 of 64'],
          ['Mirrored', 'Yes, left to right'],
        ],
      },
    ],
  },
]

let n = 0
const rng = rngFor(ID)
const ck = (checkId: string, version: number, kind: CheckKind, title: string, outcome: CheckOutcome, documentId?: string, findingId?: string): CheckResult => {
  n++
  return {
    id: `${ID}-C${n}`,
    appId: ID,
    checkId,
    version,
    kind,
    title,
    outcome,
    documentId,
    findingId,
    durationMs: durationFor(kind, outcome, rng),
  }
}

const checks: CheckResult[] = [
  ck('R-NOC-001', 2, 'Rule', 'Fire NOC valid on the first day of the academic year', 'fail', D.fire.id, F(1)),
  ck('SRC-MFS-NOC', 1, 'Source verification', 'Confirm NOC number with Maharashtra Fire Services', 'error', D.fire.id, F(2)),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.fire.id),
  ck('AUTH-PDF-INCREMENTAL', 1, 'Authenticity', 'No content added after signing', 'pass', D.fire.id),
  ck('AUTH-META', 1, 'Authenticity', 'File metadata consistent with issuer', 'pass', D.fire.id),

  ck('R-BCC-002', 1, 'Rule', 'Building completion certificate present', 'pass', D.bcc.id),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.bcc.id),
  ck('AUTH-PDF-INCREMENTAL', 1, 'Authenticity', 'No content added after signing', 'fail', D.bcc.id, F(3)),
  ck('SRC-PMC-BP', 1, 'Source verification', 'Confirm certificate with Pune Municipal Corporation', 'pass', D.bcc.id),
  ck('REC-AREA', 1, 'Reconciliation', 'Built-up area matches declared area', 'pass', D.bcc.id),

  ck('R-ACC-004', 1, 'Rule', 'Accreditation valid through the academic year', 'pass', D.nba.id),
  ck('AUTH-QR-MATCH', 1, 'Authenticity', 'Printed values match QR payload', 'fail', D.nba.id, F(4)),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.nba.id),
  ck('SRC-NBA', 1, 'Source verification', 'Confirm with National Board of Accreditation (no service yet)', 'na', D.nba.id),

  ck('R-FSR-005', 2, 'Rule', 'Faculty to student ratio at least 1:20', 'pass', D.faculty.id),
  ck('R-PRN-006', 1, 'Rule', 'Principal holds the prescribed qualification', 'pass', D.faculty.id),
  ck('XAPP-FACULTY', 1, 'Cross-application', 'Faculty IDs not listed by another application', 'fail', D.faculty.id, F(5)),
  ck('REC-FAC-ROSTER', 1, 'Reconciliation', 'Faculty IDs registered to this institution in the roster', 'fail', D.faculty.id, F(5)),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.faculty.id),

  ck('R-UNI-003', 1, 'Rule', 'University consent for the year being applied for', 'pass', D.consent.id),
  ck('R-INT-008', 1, 'Rule', 'Intake consistent with last approval', 'pass', D.consent.id),
  ck('SRC-SPPU', 1, 'Source verification', 'Confirm consent with Savitribai Phule Pune University', 'pass', D.consent.id),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.consent.id),

  ck('R-TER-007', 1, 'Rule', 'Processing fee matches AICTE payment records', 'pass', D.ter.id),
  ck('REC-PAY', 1, 'Reconciliation', 'Transaction found in Bharat Kosh settlement file', 'pass', D.ter.id),
  ck('AUTH-META', 1, 'Authenticity', 'File metadata consistent with issuer', 'pass', D.ter.id),

  ck('R-DTE-015', 1, 'Rule', 'State government NOC within the intake applied for', 'pass', D.dte.id),
  ck('SRC-DTE-MH', 1, 'Source verification', 'Confirm NOC with DTE Maharashtra', 'error', D.dte.id, F(6)),
  ck('AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid', 'pass', D.dte.id),

  ck('XAPP-PHOTO', 1, 'Cross-application', 'Photo not reused from another application', 'fail', D.lab1.id, F(7)),
  ck('INFRA-EXIF', 1, 'Infrastructure', 'Photo taken within the last 12 months', 'pass', D.lab1.id),
  ck('INFRA-GEO', 1, 'Infrastructure', 'Photo location inside the campus boundary', 'pass', D.lab1.id),

  ck('REC-PID', 1, 'Reconciliation', 'Permanent ID matches the AICTE institution register', 'pass'),
  ck('REC-LAST-APPROVAL', 1, 'Reconciliation', 'Programmes match the 2026-27 approval letter', 'pass'),
  ck('R-COM-009', 1, 'Rule', 'Mandatory committees constituted', 'pass'),
  ck('R-CLS-010', 1, 'Rule', 'Classroom area per student', 'pass'),
  ck('R-LAB-011', 1, 'Rule', 'Laboratories per programme', 'pass'),
  ck('R-LND-012', 1, 'Rule', 'Land documents present (on record since the 2024-25 approval)', 'na'),
  ck('R-AFF-013', 1, 'Rule', 'Declaration e-signed by the chairman', 'pass'),
  ck('R-WEB-014', 1, 'Rule', 'Mandatory disclosure published on the website', 'pass'),
  ck('AUTH-DUP-HASH', 1, 'Authenticity', 'No file reused from another application', 'pass'),
]

export const FLAGSHIP: AppBundle = { app, documents, checks, findings }
